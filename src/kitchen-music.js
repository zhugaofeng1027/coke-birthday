const TEMPO = { flower: 76, easy: 108, order: 132, closing: 148 };
const MELODY = [
  [null, 76, 79, null, 81, 79, 76, null],
  [74, null, 76, 72, null, 67, 69, null],
  [null, 72, 76, null, 79, 76, 72, 74],
  [77, null, 76, 74, 71, null, 74, null],
  [null, 76, 79, null, 84, 81, 79, null],
  [77, null, 74, 72, null, 74, 76, null],
  [79, null, 76, 72, 81, null, 77, 76],
  [74, null, 71, 74, 72, null, null, null],
];
const HARMONY = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59],
  [48, 55, 64], [50, 57, 65], [41, 48, 60], [43, 50, 59]];

export function kitchenMusicTempo(kitchen) {
  if (!kitchen || kitchen.delivered || kitchen.expired || kitchen.timeLeft <= 0) return null;
  if (kitchen.timeLeft <= 20) return 'closing';
  if (kitchen.orders.some(order => {
    const left = order.expiresAt - kitchen.elapsed;
    return left > 0 && left <= 15;
  })) return 'order';
  return 'easy';
}

export function createKitchenMusic(audio) {
  let output;
  let timer;
  let target = TEMPO.easy;
  let bpm = target;
  let step = 0;
  let next = 0;

  function pluck(pitch, when, length, level, type = 'triangle') {
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((pitch - 69) / 12);
    envelope.gain.setValueAtTime(.0001, when);
    envelope.gain.exponentialRampToValueAtTime(level, when + .009);
    envelope.gain.exponentialRampToValueAtTime(.0001, when + length);
    oscillator.connect(envelope).connect(output);
    oscillator.start(when);
    oscillator.stop(when + length + .01);
  }

  function schedule() {
    if (audio.state !== 'running') return;
    const now = audio.currentTime;
    // Keep the phrase position on tempo changes, without playing catch-up after a stalled frame.
    if (next < now) next = now + .02;
    while (next < now + .11) {
      bpm += (target - bpm) * .26;
      const eighth = 30 / bpm;
      const beat = step % 8;
      const bar = Math.floor(step / 8);
      const [root, fifth, third] = HARMONY[bar];
      const melody = MELODY[bar][beat];
      if (target === TEMPO.flower) {
        if (melody !== null) {
          pluck(melody, next, eighth * 1.75, .085, 'sine');
          pluck(melody + 12, next + .012, eighth * .65, .016, 'sine');
        }
      } else {
        if (melody !== null) pluck(melody, next, eighth * 1.2, .07);
        if (beat === 0 || beat === 4) pluck(beat === 0 ? root : fifth, next, eighth * 1.55, .074, 'sine');
        if (beat === 2 || beat === 6 || (target > TEMPO.easy && beat % 2)) {
          pluck(fifth + 12, next, .09, .026, 'sine');
          pluck(third, next, .1, .034);
        }
        if (target === TEMPO.closing && beat % 2 === 0) pluck(root - 12, next, .075, .04, 'sine');
      }
      step = (step + 1) % (MELODY.length * 8);
      next += eighth;
    }
  }

  function stop() {
    if (!output) return;
    clearInterval(timer);
    const current = output;
    const now = audio.currentTime;
    current.gain.setTargetAtTime(0, now, .019);
    setTimeout(() => current.disconnect(), 140);
    output = null;
  }

  return {
    setMode(mode) {
      if (!mode) { stop(); return; }
      target = TEMPO[mode];
      if (output) return;
      output = audio.createGain();
      output.gain.value = .32;
      output.connect(audio.destination);
      bpm = target;
      next = audio.currentTime + .04;
      schedule();
      timer = setInterval(schedule, 35);
    },
    reset() { stop(); step = 0; },
  };
}
