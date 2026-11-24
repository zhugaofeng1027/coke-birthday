export function measureBlow(samples, spectrum, sampleRate) {
  let sum = 0; let energy = 0;
  for (const sample of samples) { sum += sample; energy += sample * sample; }
  const rms = Math.sqrt(Math.max(0, energy / samples.length - (sum / samples.length) ** 2));
  if (rms < .009) return { rms, windy: false };

  const binHz = sampleRate / (2 * spectrum.length);
  let power = 0; let lowPower = 0; let peak = 0;
  for (let i = Math.ceil(45 / binHz); i < spectrum.length && i * binHz <= 4200; i++) {
    const binPower = 10 ** (spectrum[i] / 10);
    power += binPower;
    if (i * binHz <= 850) lowPower += binPower;
    peak = Math.max(peak, binPower);
  }
  if (!power || lowPower / power < .38 || peak / power > .24) return { rms, windy: false };

  // A voice can have plenty of bass, but its waveform repeats at the pitch period.
  for (let lag = Math.floor(sampleRate / 420); lag <= sampleRate / 80; lag += 3) {
    let overlap = 0; let left = 0; let right = 0;
    for (let i = 0; i + lag < samples.length; i += 4) {
      const a = samples[i]; const b = samples[i + lag];
      overlap += a * b; left += a * a; right += b * b;
    }
    if (overlap > .72 * Math.sqrt(left * right)) return { rms, windy: false };
  }
  return { rms, windy: true };
}

export function createBlowDetector() {
  const roomNoise = [];
  let elapsed = 0; let gust = 0; let threshold = .009;
  return (frame, dt) => {
    const step = Math.min(55, Math.max(0, dt));
    if (elapsed < 600) {
      roomNoise.push(frame.rms);
      elapsed += step;
      if (elapsed >= 600) {
        roomNoise.sort((a, b) => a - b);
        threshold = Math.max(.009, roomNoise[Math.floor(roomNoise.length / 2)] * 2.5 + .004);
      }
      return { calibrating: true, wind: 0, blown: false };
    }
    if (dt > 105) gust = 0;
    const strong = frame.windy && frame.rms >= threshold;
    gust = Math.max(0, gust + (strong ? step : -step * 2.5));
    return { calibrating: false, wind: Math.min(1, gust / 285), blown: gust >= 340 };
  };
}

export function createCandleMic({ onState, onWind, onBlow }) {
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
      current.timer = setTimeout(() => stop('timeout'), 22000);
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
      let listening = false;
      onState('calibrating');
      const tick = (now) => {
        const dt = now - previous;
        if (dt >= 30) {
          previous = now;
          analyser.getFloatTimeDomainData(samples);
          analyser.getFloatFrequencyData(spectrum);
          const result = detect(measureBlow(samples, spectrum, audio.sampleRate), dt);
          if (!result.calibrating && !listening) { listening = true; onState('listening'); }
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
