export function shouldPlay(intersectionRatio, threshold = 0.5) {
  return intersectionRatio >= threshold;
}
