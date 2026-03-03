export function formatSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

export function formatCentiseconds(totalCentiseconds: number): string {
  const value = Math.max(0, Math.floor(totalCentiseconds));
  const totalSeconds = Math.floor(value / 100);
  const centiseconds = (value % 100).toString().padStart(2, "0");
  const hrs = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${hrs}:${mins}:${secs}.${centiseconds}`;
}

export function toMinuteOfDay(time: string): number {
  const [h, m] = time.split(":").map((v) => Number(v));
  return h * 60 + m;
}

export function fromMinuteOfDay(value: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.round(value)));
  const h = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const m = Math.floor(clamped % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}`;
}
