'use client';

import { useEffect, useState } from 'react';

/** A thin band just above the middle of the viewport decides which section is "current". */
const ROOT_MARGIN = '-45% 0px -50% 0px';

/**
 * Id of the section currently in view (first of `ids` crossing the viewport band), or null.
 * The last id also wins once the page is scrolled to the very bottom, so a short final section
 * (the footer) can still become active. Off when `enabled` is false or IO is unavailable.
 */
export function useActiveSection(ids: readonly string[], enabled = true): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join('|');

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return;
    const order = key.split('|').filter(Boolean);
    const visible = new Set<string>();
    let atBottom = false;

    const update = () => {
      const last = order[order.length - 1] ?? null;
      setActive(
        atBottom && last && document.getElementById(last)
          ? last
          : (order.find((id) => visible.has(id)) ?? null),
      );
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        update();
      },
      { rootMargin: ROOT_MARGIN },
    );
    for (const id of order) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }

    const onScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (bottom !== atBottom) {
        atBottom = bottom;
        update();
      }
    };
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [key, enabled]);

  return enabled ? active : null;
}
