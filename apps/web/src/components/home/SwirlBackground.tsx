'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { advance, makeVortices, spawnStreak, streakCount, type Streak, type Vortex } from './swirl';

// Page background #0a0a0a; the fade uses the same colour so trails melt into the page.
const BG = '10, 10, 10';
const STREAK = 'rgba(255, 214, 180, 0.30)'; // warm white, reads orange-tinted on black
const GLOW = '255, 122, 26'; // vortex centres: soft orange orbs

/**
 * Fixed full-viewport flow field behind the home page (idea from the owner's portfolio
 * "starry night" swirl, recoloured for the black/orange theme). Opaque sections (Team,
 * Projects) cover it; transparent ones (Hero, About, Squads, Vision) show it.
 * Reduced motion: draws a still frame once. Paused while the tab is hidden.
 */
export function SwirlBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let vortices: Vortex[] = [];
    let streaks: Streak[] = [];
    let t = 0;
    let raf = 0;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, w, h);
      vortices = makeVortices(w, h);
      streaks = Array.from({ length: streakCount(w, h) }, () => spawnStreak(w, h));
    };

    const frame = () => {
      ctx.fillStyle = `rgba(${BG}, 0.045)`;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = STREAK;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i < streaks.length; i++) {
        const p = streaks[i]!;
        ctx.moveTo(p.x, p.y);
        const alive = advance(p, t, vortices, w, h);
        ctx.lineTo(p.x, p.y);
        if (!alive) streaks[i] = spawnStreak(w, h);
      }
      ctx.stroke();
      for (const v of vortices) {
        const g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, 16);
        // Drawn every frame on top of the slow fade, so it builds up: keep it faint.
        g.addColorStop(0, `rgba(${GLOW}, 0.012)`);
        g.addColorStop(1, `rgba(${GLOW}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(v.x - 16, v.y - 16, 32, 32);
      }
      t += 0.004;
    };

    const loop = () => {
      frame();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    };

    build();
    if (reduce) {
      for (let i = 0; i < 220; i++) frame(); // one still, fully developed frame
    } else {
      start();
    }

    // Rebuild on width changes only: mobile URL-bar height changes would otherwise reset it.
    let lastW = window.innerWidth;
    let timer = 0;
    const onResize = () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        build();
        if (reduce) for (let i = 0; i < 220; i++) frame();
      }, 150);
    };
    const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : !reduce && start());

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduce]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-lvh w-full opacity-70"
    />
  );
}
