export function supportsViewTransitions(doc = document) {
  return typeof doc.startViewTransition === 'function';
}

export function navigateWithTransition(url, { doc = document, loc = location } = {}) {
  if (supportsViewTransitions(doc)) doc.startViewTransition(() => { loc.href = url; });
  else loc.href = url;
}
