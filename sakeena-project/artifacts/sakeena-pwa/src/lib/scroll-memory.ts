// Remembers where you were on each page, so coming back (browser back, or the
// in-app back arrow) returns you to the same spot instead of the top.
const positions = new Map<string, number>();
let current = typeof window === 'undefined' ? '/' : window.location.pathname + window.location.search;
let pendingBack = false;
let installed = false;

export function installScrollMemory() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const save = () => positions.set(current, window.scrollY);

  // Going forward: remember the page we are leaving, right before the URL changes.
  const originalPush = history.pushState.bind(history);
  history.pushState = (...args: Parameters<History['pushState']>) => { save(); return originalPush(...args); };

  // Browser back/forward button (or phone gesture).
  window.addEventListener('popstate', () => { save(); pendingBack = true; });

  // The in-app back arrows are normal links, so recognise them by their label.
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('a');
    if (!link) return;
    const text = link.textContent?.trim() ?? '';
    if (link.getAttribute('aria-label') === 'رجوع' || text.startsWith('عودة')) pendingBack = true;
  }, true);
}

// Called once the new page has rendered.
export function onNavigated() {
  const path = window.location.pathname + window.location.search;
  const back = pendingBack;
  pendingBack = false;
  if (path === current) return;
  current = path;
  const target = back ? positions.get(path) : undefined;
  if (target === undefined) { if (!window.location.hash) window.scrollTo(0, 0); return; }
  // Content can still be loading, so try for a short while until the page is tall enough.
  let tries = 0;
  const attempt = () => {
    window.scrollTo(0, target);
    tries += 1;
    if (Math.abs(window.scrollY - target) > 2 && tries < 25) requestAnimationFrame(attempt);
  };
  requestAnimationFrame(attempt);
}
