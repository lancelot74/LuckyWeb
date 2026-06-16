export function frameIndexForProgress(progress, frameCount) {
  if (frameCount <= 0) return 0;
  const p = Math.min(1, Math.max(0, progress));
  return Math.min(frameCount - 1, Math.floor(p * frameCount));
}
