// Synthesised keyclick via Web Audio API — no audio files, no external deps.

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }

  return ctx;
}

export function resumeContext(): void {
  const ac = getContext();
  if (ac.state === 'suspended') {
    void ac.resume();
  }
}

export function playKeyClick(): void {
  const ac = getContext();
  resumeContext();

  const bufferSize = Math.floor(ac.sampleRate * 0.015);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ac.createBufferSource();
  source.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  filter.Q.value = 0.8;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.18, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.04);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);

  source.start();
  source.stop(ac.currentTime + 0.04);
}

export function destroyContext(): void {
  if (!ctx) {
    return;
  }

  void ctx.close();
  ctx = null;
}
