import FFT from 'fft.js';
import { createBlowDetector, measureBlow } from '../src/candle-mic.js';

const SAMPLE_RATE = 16000;
const WINDOW = 1024;
const FRAME_MS = WINDOW / SAMPLE_RATE * 1000;

export function createPcmBlowDetector(onFrame) {
  const fft = new FFT(WINDOW);
  const samples = new Float32Array(WINDOW);
  const windowed = new Float32Array(WINDOW);
  const coefficients = Float32Array.from(samples, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / (WINDOW - 1)));
  const output = fft.createComplexArray();
  const spectrum = new Float32Array(WINDOW / 2);
  const detect = createBlowDetector();
  let used = 0;
  let silence = 0;

  return buffer => {
    const pcm = new DataView(buffer);
    for (let offset = 0; offset + 1 < pcm.byteLength; offset += 2) {
      samples[used++] = pcm.getInt16(offset, true) / 32768;
      if (used !== WINDOW) continue;
      used = 0;
      for (let i = 0; i < WINDOW; i++) windowed[i] = samples[i] * coefficients[i];
      fft.realTransform(output, windowed);
      for (let i = 0; i < spectrum.length; i++) {
        spectrum[i] = 10 * Math.log10(Math.max(1e-14, output[2 * i] ** 2 + output[2 * i + 1] ** 2));
      }
      const frame = measureBlow(samples, spectrum, SAMPLE_RATE);
      silence = frame.rms < .00045 ? silence + FRAME_MS : 0;
      const result = detect(frame, FRAME_MS);
      const phase = result.calibrating ? 'calibrating' : silence >= 2400 ? 'no-signal' : 'listening';
      onFrame(result, phase, Math.min(1, frame.rms / .007));
      if (result.blown) return;
    }
  };
}

export function createMicrophone(wx, { onState, onReading, onBlow }) {
  const recorder = wx.getRecorderManager?.();
  let owner = null;
  let recording = false;
  let timer;

  function stop(state = 'idle') {
    if (!owner) return;
    owner = null;
    clearTimeout(timer);
    onReading(0, 0);
    onState(state);
    if (recording) {
      try { recorder.stop(); } catch { recording = false; }
    }
  }

  recorder?.onFrameRecorded(({ frameBuffer }) => {
    if (owner?.read && frameBuffer?.byteLength) owner.read(frameBuffer);
  });
  recorder?.onStart(() => {
    if (owner) onState('calibrating');
    else { try { recorder.stop(); } catch { recording = false; } }
  });
  recorder?.onError(({ errMsg = '' } = {}) => {
    recording = false;
    stop(/auth|deny|permission|privacy/i.test(errMsg) ? 'denied' : 'unavailable');
  });
  recorder?.onStop(({ tempFilePath } = {}) => {
    recording = false;
    if (tempFilePath) wx.getFileSystemManager?.().unlink({ filePath: tempFilePath, fail() {} });
    if (owner) stop('timeout');
  });

  function toggle() {
    if (owner) { stop(); return; }
    if (!recorder) { onState('unavailable'); return; }
    if (recording) return;
    const session = owner = {};
    onState('requesting');
    const start = () => {
      if (owner !== session) return;
      session.read = createPcmBlowDetector(({ wind, blown }, phase, level) => {
        if (owner !== session) return;
        onState(phase);
        onReading(wind, level);
        if (blown) { stop(); onBlow(); }
      });
      try {
        recording = true;
        timer = setTimeout(() => stop('timeout'), 22000);
        recorder.start({ duration: 21000, sampleRate: SAMPLE_RATE, numberOfChannels: 1, format: 'PCM', frameSize: 2 });
      } catch { recording = false; stop('unavailable'); }
    };
    const denied = () => { if (owner === session) stop('denied'); };
    const authorize = () => {
      if (owner !== session) return;
      if (wx.authorize) wx.authorize({ scope: 'scope.record', success: start, fail: denied });
      else start();
    };
    try {
      if (wx.requirePrivacyAuthorize) wx.requirePrivacyAuthorize({ success: authorize, fail: denied });
      else authorize();
    } catch { denied(); }
  }

  return { stop, toggle };
}
