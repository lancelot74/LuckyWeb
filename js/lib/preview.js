export function shouldPlay(intersectionRatio, threshold = 0.5) {
  return intersectionRatio >= threshold;
}

// Index of the highest ratio that is >= min, or -1 if none. Ties resolve to the lowest index.
export function indexOfMostVisible(ratios, min = 0.5) {
  let best = -1, bestRatio = -Infinity;
  for (let i = 0; i < ratios.length; i++) {
    if (ratios[i] >= min && ratios[i] > bestRatio) { best = i; bestRatio = ratios[i]; }
  }
  return best;
}
