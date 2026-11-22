/**
 * Home intro timeline (port of docs/prototypes/intro.html).
 *
 * Runs as an inline <script> in <head>, before first paint and before React hydrates, so the
 * server-rendered hero never flashes and the timeline doesn't wait for JS bundles.
 * All motion is CSS (globals.css); this only moves <html data-intro> through its states:
 *
 *   pending (popup, 0–1.9s) → burst (1.9s) → reveal (2.1s) → settled (+2.2s)
 *
 * Must stay self-contained: it is serialized with Function.prototype.toString().
 */
export function runIntro(win: Window = window): void {
  const doc = win.document;
  const root = doc.documentElement;
  const KEY = 'ds_intro_seen';

  if (win.location.pathname !== '/') return;
  try {
    if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (win.sessionStorage.getItem(KEY)) return;
    win.sessionStorage.setItem(KEY, '1');
  } catch {
    // Storage blocked (private mode, etc.): still play, just can't remember it.
  }

  const timers: number[] = [];
  const at = (ms: number, fn: () => void) => timers.push(win.setTimeout(fn, ms));
  const set = (state: string) => root.setAttribute('data-intro', state);
  const clear = () => timers.splice(0).forEach((t) => win.clearTimeout(t));

  const settle = (afterMs: number) => {
    at(afterMs, () => {
      set('settled');
      doc.removeEventListener('keydown', onKey);
      doc.removeEventListener('click', onClick, true);
    });
  };
  const skip = () => {
    const state = root.getAttribute('data-intro');
    if (state !== 'pending' && state !== 'burst') return;
    clear();
    set('reveal');
    settle(1800);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') skip();
  };
  const onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (target && target.closest && target.closest('[data-intro-overlay]')) skip();
  };

  set('pending');
  doc.addEventListener('keydown', onKey);
  doc.addEventListener('click', onClick, true);
  at(1900, () => set('burst'));
  at(2100, () => {
    set('reveal');
    settle(2200);
  });
}

export const introScript = `(${runIntro.toString()})(window);`;
