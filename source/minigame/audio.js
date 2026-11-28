import { createKitchenMusic } from '../src/kitchen-music.js';
import { playKitchenSound } from '../src/kitchen-sounds.js';

export function createAudio(wx) {
  let audio;
  let music;
  let muted = false;
  let mode = null;

  function apply() {
    if (audio?.state === 'running') music.setMode(muted ? null : mode);
  }

  return {
    get muted() { return muted; },
    setMuted(value) { muted = value; apply(); },
    setMode(value) {
      if (mode === value) return;
      mode = value;
      apply();
    },
    async unlock() {
      if (muted) return false;
      try {
        if (!audio) {
          audio = wx.createWebAudioContext();
          music = createKitchenMusic(audio);
        }
        if (audio.state === 'suspended') await audio.resume();
        apply();
        return audio.state === 'running';
      } catch { return false; }
    },
    cue(cue) {
      if (muted || audio?.state !== 'running') return;
      try { playKitchenSound(audio, cue); } catch { /* Optional sound effect. */ }
    },
  };
}
