export const CHOP_BEAT = .3;

export function playKitchenSound(audio, cue) {
  const start = audio.currentTime;
  const voices = {
    take: { notes: [[620, .085, .06, 1.18]] },
    place: { notes: [[340, .10, .09, .51], [830, .053, .035, .84]], noise: [.022, .065, 1400] },
    oven: { notes: [[268, .12, .09, .58], [725, .065, .04, .83]], noise: [.08, .08, 1000] },
    chop: { notes: [[186, .07, .13, .02]], noise: [.037, .14, 1700] },
    lid: { notes: [[220, .095, .12, .11]], noise: [.055, .12, 1050] },
    band: { notes: [[440, .09, .09, .55]], noise: [.047, .10, 1900] },
    seal: { notes: [[545, .11, .05, .3], [790, .085, .025, .65]] },
    serve: { notes: [[1180, .43, .14, .98], [1620, .25, .065, .98], [2300, .11, .03, .98]], noise: [.025, .06, 2500] },
  };
  const voice = voices[cue];
  if (!voice) return;
  for (const [frequency, duration, volume, ratio] of voice.notes) {
    const tone = audio.createOscillator();
    const gain = audio.createGain();
    tone.type = cue === 'serve' ? 'sine' : 'triangle';
    tone.frequency.setValueAtTime(frequency, start);
    tone.frequency.exponentialRampToValueAtTime(frequency * ratio, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    tone.connect(gain).connect(audio.destination);
    tone.start(start);
    tone.stop(start + duration);
  }
  if (!voice.noise) return;
  const [duration, volume, frequency] = voice.noise;
  const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  source.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start(start);
}
