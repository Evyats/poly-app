export function playDoneChime() {
  const audioCtx = new AudioContext();
  const now = audioCtx.currentTime;
  const gain = audioCtx.createGain();

  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

  [523.25, 659.25, 783.99].forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(now + idx * 0.15);
    osc.stop(now + idx * 0.15 + 0.45);
  });
}
