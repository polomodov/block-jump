// Notes are scheduled in seconds. Tiny envelopes keep the chiptune pulses click-free.
const cues = {
  jump:       [[0, 290, 510, .10]],
  gem:        [[0, 740, 740, .055], [.065, 990, 990, .10]],
  ability:    [[0, 330, 390, .07], [.07, 494, 590, .08], [.15, 660, 740, .12]],
  checkpoint: [[0, 523, 523, .10], [.11, 659, 659, .10], [.22, 784, 784, .17]],
  hit:        [[0, 240, 105, .18], [.18, 120, 80, .09]],
  win:        [[0, 523, 523, .12], [.13, 659, 659, .12], [.26, 784, 784, .12], [.42, 1047, 1047, .28]],
};
let context;
let master;
let enabled = false;
let guitarRiff;
let guitarVoice;

export function setSoundEnabled(value) {
  enabled = value;
  if (!enabled) stopGuitar();
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  if (enabled && !context) {
    context = new Audio();
    master = context.createGain();
    master.connect(context.destination);
  }
  if (!context) return;
  master.gain.setTargetAtTime(enabled ? .10 : 0, context.currentTime, .008);
  if (enabled && context.state !== 'running') context.resume().catch(() => {});
}

// Pluck each string once, then let the vibration lose treble on every cycle.
function makeGuitarRiff() {
  const rate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.ceil(1.2 * rate), rate);
  const samples = buffer.getChannelData(0);
  const notes = [
    [0, 164.81], [0.025, 196], [0.050, 246.94],
    [0.22, 293.66], [0.34, 329.63],
    [0.53, 164.81], [0.55, 246.94], [0.57, 392],
  ];
  for (const [onset, frequency] of notes) {
    const period = Math.round(rate / frequency + 0.5);
    const string = Float32Array.from({ length: period }, () => Math.random() * 2 - 1);
    const start = Math.round(onset * rate);
    for (let i = start; i < samples.length; i++) {
      const pos = (i - start) % period;
      const envelope = Math.min(1, (i - start) / (0.003 * rate), (samples.length - i) / (0.03 * rate));
      samples[i] += .2 * envelope * string[pos];
      string[pos] = 0.497 * (string[pos] + string[(pos + 1) % period]);
    }
  }
  return buffer;
}

export function stopGuitar() {
  if (!guitarVoice) return;
  guitarVoice.stop();
  guitarVoice = undefined;
}

function playGuitar() {
  guitarRiff ??= makeGuitarRiff();
  const voice = context.createBufferSource();
  voice.buffer = guitarRiff;
  // Short string attacks need more headroom than the sustained chiptune oscillators.
  const gain = context.createGain();
  gain.gain.value = 4;
  voice.connect(gain);
  gain.connect(master);
  voice.onended = () => {
    voice.disconnect();
    gain.disconnect();
    if (voice === guitarVoice) guitarVoice = undefined;
  };
  guitarVoice = voice;
  voice.start();
}

export function playSound(name) {
  if (!enabled || context?.state !== 'running') return;
  if (name === 'guitar') { playGuitar(); return; }
  if (!cues[name]) return;
  const now = context.currentTime;
  for (const [offset, startHz, endHz, length] of cues[name]) {
    const start = now + offset;
    const tone = context.createOscillator();
    const envelope = context.createGain();
    tone.type = name === 'hit' ? 'sawtooth' : 'triangle';
    tone.frequency.setValueAtTime(startHz, start);
    tone.frequency.exponentialRampToValueAtTime(endHz, start + length);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(.65, start + .009);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + length);
    tone.connect(envelope);
    envelope.connect(master);
    tone.onended = () => { tone.disconnect(); envelope.disconnect(); };
    tone.start(start);
    tone.stop(start + length + .01);
  }
}
