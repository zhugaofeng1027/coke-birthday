const MIN_BLOW_RMS = .0018;
const BLOW_MS = 210;

export function measureBlow(samples, spectrum, sampleRate) {
  let sum = 0; let energy = 0;
  for (const sample of samples) { sum += sample; energy += sample * sample; }
  const mean = sum / samples.length;
  const rms = Math.sqrt(Math.max(0, energy / samples.length - mean ** 2));
  if (rms < MIN_BLOW_RMS) return { rms, windy: false };

  const binHz = sampleRate / (2 * spectrum.length);
  let power = 0; let lowPower = 0; let peak = 0;
  const bands = [0, 0, 0, 0];
  for (let i = Math.ceil(45 / binHz); i < spectrum.length && i * binHz <= 5200; i++) {
    const hz = i * binHz;
    const binPower = 10 ** (spectrum[i] / 10);
    power += binPower;
    if (hz <= 850) lowPower += binPower;
    bands[hz < 500 ? 0 : hz < 1100 ? 1 : hz < 2300 ? 2 : 3] += binPower;
    peak = Math.max(peak, binPower);
  }
  // Phone microphones may cut the bass, but a gust still spans multiple bands.
  const broadband = bands.filter(band => band >= .04 * power).length >= 3;
  if (!power || peak / power > .24 || (lowPower / power < .38 && !broadband)) return { rms, windy: false };

  // A voice can have plenty of bass, but its waveform repeats at the pitch period.
  for (let lag = Math.floor(sampleRate / 420); lag <= sampleRate / 80; lag += 3) {
    let overlap = 0; let left = 0; let right = 0;
    for (let i = 0; i + lag < samples.length; i += 4) {
      const a = samples[i] - mean; const b = samples[i + lag] - mean;
      overlap += a * b; left += a * a; right += b * b;
    }
    if (overlap > .72 * Math.sqrt(left * right)) return { rms, windy: false };
  }
  return { rms, windy: true };
}

export function createBlowDetector() {
  const roomNoise = [];
  let elapsed = 0; let gust = 0; let threshold = MIN_BLOW_RMS;
  return (frame, dt) => {
    const step = Math.min(65, Math.max(0, dt));
    if (elapsed < 600) {
      roomNoise.push(frame.rms);
      elapsed += step;
      if (elapsed >= 600) {
        roomNoise.sort((a, b) => a - b);
        const baseline = roomNoise[Math.floor(roomNoise.length * .35)];
        threshold = Math.max(MIN_BLOW_RMS, baseline * 1.65 + .00065);
      }
      return { calibrating: true, wind: 0, blown: false };
    }
    if (dt > 180) gust = 0;
    const strong = frame.windy && frame.rms >= threshold;
    gust = Math.max(0, gust + (strong ? step : -step * 1.5));
    return { calibrating: false, wind: Math.min(1, gust / BLOW_MS), blown: gust >= BLOW_MS };
  };
}

export function createCandleMic({ onState, onWind, onLevel, onBlow }) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  let session = null;

  function stop(status = 'idle') {
    if (!session) return;
    const current = session;
    session = null;
    cancelAnimationFrame(current.frame);
    clearTimeout(current.timer);
    current.stream?.getTracks().forEach(track => track.stop());
    void current.audio?.close().catch(() => {});
    onWind(0);
    onLevel(0);
    onState(status);
  }

  async function toggle() {
    if (session) { stop(); return; }
    if (!window.isSecureContext) { onState('insecure'); return; }
    if (!Audio || !navigator.mediaDevices?.getUserMedia) { onState('unavailable'); return; }
    const current = {};
    session = current;
    onState('requesting');
    try {
      const audio = current.audio = new Audio();
      // Unlock audio in the same gesture that requests permission.
      void audio.resume().catch(() => {});
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      if (session !== current) { stream.getTracks().forEach(track => track.stop()); return; }
      current.stream = stream;
      current.timer = setTimeout(() => stop(audio.state === 'running' ? 'timeout' : 'unavailable'), 22000);
      stream.getAudioTracks().forEach(track => track.addEventListener('ended', () => {
        if (session === current) stop('unavailable');
      }, { once: true }));
      if (audio.state !== 'running') await audio.resume();
      if (session !== current) return;
      const analyser = audio.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = .08;
      const silent = audio.createGain();
      silent.gain.value = 0;
      audio.createMediaStreamSource(stream).connect(analyser).connect(silent).connect(audio.destination);
      const samples = new Float32Array(analyser.fftSize);
      const spectrum = new Float32Array(analyser.frequencyBinCount);
      const detect = createBlowDetector();
      let previous = performance.now();
      let phase = 'calibrating';
      let silentSince = previous;
      onState(phase);
      const tick = (now) => {
        const dt = now - previous;
        if (dt >= 30) {
          previous = now;
          analyser.getFloatTimeDomainData(samples);
          analyser.getFloatFrequencyData(spectrum);
          const frame = measureBlow(samples, spectrum, audio.sampleRate);
          const result = detect(frame, dt);
          if (frame.rms >= .00045) silentSince = now;
          const next = result.calibrating ? 'calibrating' : now - silentSince >= 2400 ? 'no-signal' : 'listening';
          if (next !== phase) { phase = next; onState(phase); }
          onLevel(Math.min(1, Math.max(0, (frame.rms - .00045) / (MIN_BLOW_RMS * 2))));
          onWind(result.wind);
          if (result.blown) { stop(); onBlow(); return; }
        }
        current.frame = requestAnimationFrame(tick);
      };
      current.frame = requestAnimationFrame(tick);
    } catch (error) {
      if (session === current) stop(error?.name === 'NotAllowedError' ? 'denied' : 'unavailable');
    }
  }

  return { toggle, stop };
}
