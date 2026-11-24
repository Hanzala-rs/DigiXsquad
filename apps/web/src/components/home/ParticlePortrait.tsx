'use client';

import { useContext, useEffect, useRef } from 'react';
import { HeroExitContext } from './HeroStage';
import {
  countOpaque,
  createField,
  emberAlpha,
  interiorAlpha,
  layoutField,
  sampleParticles,
  scatterField,
  spawnEmber,
  stepEmber,
  stepForCount,
  stepParticles,
  type Box,
  type Ember,
  type ParticleField,
} from './particles';

/** Target particle counts (desktop / phone < 820px). */
const COUNT_DESKTOP = 7800;
const COUNT_MOBILE = 3600;
/** Rising sparks around the figure. */
const EMBERS_DESKTOP = 70;
const EMBERS_MOBILE = 32;
/** Seconds after the intro starts when the dots dissolve into the real photo. */
const FORM_AT = 1.5;
const MOBILE_MAX = 819;
/** Pointer hole radius at a ~740px-tall figure; scaled with the figure. */
const HOLE_RADIUS = 90;
/** The figure box inside .ds-center: same as .ds-portrait (top 10%, full width, 90% height). */
const FIGURE_TOP = 0.1;

/**
 * The founder assembled from thousands of orange dots on a 2D canvas, which then dissolve into
 * the real photo, leaving a glowing particle outline around the silhouette and sparks rising
 * from below. The pointer pushes the outline and sparks away; scrolling the hero away turns the
 * photo back into dots and scatters them.
 *
 * Progressive enhancement over the server-rendered <Image> underneath: until the first frame is
 * drawn (or if anything fails, or under reduced motion) the static photo simply shows.
 * CSS: `[data-live]` hides the photo while the dots assemble, `[data-formed]` brings it back.
 */
export function ParticlePortrait({ src }: { src: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exit = useContext(HeroExitContext);
  // Read the latest scroll progress inside the rAF loop without restarting the effect.
  const exitRef = useRef(exit);
  useEffect(() => {
    exitRef.current = exit;
  }, [exit]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const root = document.documentElement;
    let disposed = false;
    let sample: ImageData | null = null;
    let opaque = 0;
    let field: ParticleField | null = null;
    let mobile: boolean | null = null;
    let box: Box = { x: 0, y: 0, w: 0, h: 0 };
    let cw = 0;
    let ch = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let introAt = -1;
    let inView = true;
    let live = false;
    let formed = false;
    let embers: Ember[] = [];
    let interior = 1;
    const pointer = { cx: 0, cy: 0, active: false, strength: 0 };

    const introReady = () => {
      const s = root.getAttribute('data-intro');
      return !s || s === 'reveal' || s === 'settled';
    };

    const build = () => {
      if (!sample) return;
      mobile = window.innerWidth <= MOBILE_MAX;
      const step = stepForCount(opaque, mobile ? COUNT_MOBILE : COUNT_DESKTOP);
      field = createField(
        sampleParticles(sample, { step, edgeRadius: step * 1.6 }),
        sample.width,
        sample.height,
        step,
        Math.random,
        0.9, // scattered look instead of a screen-door grid
      );
      layoutField(field, box, true);
      if (introAt < 0) scatterField(field);
      embers = Array.from({ length: mobile ? EMBERS_MOBILE : EMBERS_DESKTOP }, () =>
        spawnEmber(box, Math.random, true),
      );
    };

    const resize = () => {
      const center = wrap.offsetParent as HTMLElement | null;
      cw = wrap.clientWidth;
      ch = wrap.clientHeight;
      if (!center || !cw || !ch) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      // Figure box in canvas CSS px (offsets ignore the scroll-exit translate).
      box = {
        x: -wrap.offsetLeft,
        y: center.clientHeight * FIGURE_TOP - wrap.offsetTop,
        w: center.clientWidth,
        h: center.clientHeight * (1 - FIGURE_TOP),
      };
      if (!sample) return;
      if (!field || mobile !== window.innerWidth <= MOBILE_MAX) build();
      else layoutField(field, box); // dots glide to their new homes
      draw();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      if (!field || introAt < 0) return;
      const { x, y, size } = field;
      // One path per colour bucket: far fewer state changes than per-dot fillRect.
      for (const b of field.buckets) {
        const a = b.alpha * (b.edge ? 1 : interior);
        if (a < 0.01) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        for (let i = b.start; i < b.end; i++) {
          const s = size[i]!;
          ctx.rect(x[i]! - s / 2, y[i]! - s / 2, s, s);
        }
        ctx.fill();
      }
      // Sparks: additive, with a soft square halo (cheaper than shadowBlur).
      ctx.globalCompositeOperation = 'lighter';
      for (const e of embers) {
        const a = emberAlpha(e);
        if (a <= 0) continue;
        const s = e.size;
        ctx.globalAlpha = a * 0.18;
        ctx.fillStyle = '#ff6a00';
        ctx.fillRect(e.x - s * 2, e.y - s * 2, s * 4, s * 4);
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = '#ffc27a';
        ctx.fillRect(e.x - s / 2, e.y - s / 2, s, s);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed || !field || !inView || document.hidden) return;
      const dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;

      pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * (1 - Math.exp(-dt * 10));
      let p = null;
      if (pointer.strength > 0.01) {
        const r = canvas.getBoundingClientRect();
        const radius = Math.min(120, Math.max(55, (HOLE_RADIUS * box.h) / 740));
        p = { x: pointer.cx - r.left, y: pointer.cy - r.top, radius, strength: pointer.strength };
      }
      const progress = exitRef.current?.get() ?? 0;
      const scatter = Math.min(1, Math.max(0, (progress - 0.04) / 0.7));

      const elapsed = (now - introAt) / 1000;
      stepParticles(field, p, dt, { time: now / 1000, elapsed, scatter });

      interior = interiorAlpha(elapsed, scatter, FORM_AT);
      const nowFormed = interior < 0.5;
      if (nowFormed !== formed) {
        formed = nowFormed;
        wrap.toggleAttribute('data-formed', formed); // CSS fades the real photo in / out
      }

      if (elapsed > 0.6) {
        const step = Math.min(dt, 1 / 30);
        for (let i = 0; i < embers.length; i++) {
          const e = embers[i]!;
          if (p) {
            const dx = e.x - p.x;
            const dy = e.y - p.y;
            const d = Math.hypot(dx, dy);
            if (d < p.radius && d > 0) e.x += (dx / d) * (p.radius - d) * 0.15 * p.strength;
          }
          if (!stepEmber(e, step, now / 1000)) embers[i] = spawnEmber(box);
        }
      }
      draw();
      if (!live) {
        live = true;
        wrap.setAttribute('data-live', ''); // fades the canvas in and the static photo out
      }
      schedule();
    };

    const schedule = () => {
      if (!raf && !disposed && introAt >= 0 && inView && !document.hidden) {
        raf = requestAnimationFrame(frame);
      }
    };

    const start = () => {
      if (introAt >= 0 || !field || !introReady()) return;
      // On reveal, wait a beat so the dots rise with the halo/frame (portrait rise has 0.2s delay).
      introAt = performance.now() + (root.getAttribute('data-intro') === 'reveal' ? 200 : 0);
      last = 0;
      schedule();
    };

    // Load + sample the source image off-screen.
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (disposed) return;
      try {
        const off = document.createElement('canvas');
        off.width = img.naturalWidth;
        off.height = img.naturalHeight;
        const octx = off.getContext('2d', { willReadFrequently: true });
        if (!octx) return;
        octx.drawImage(img, 0, 0);
        sample = octx.getImageData(0, 0, off.width, off.height);
        opaque = countOpaque(sample);
      } catch {
        return; // tainted/decoding failure: the static image stays
      }
      if (!opaque) return;
      resize();
      start();
    };
    img.src = src;

    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);

    const io = new IntersectionObserver(([entry]) => {
      inView = !!entry?.isIntersecting;
      last = 0;
      schedule();
    });
    io.observe(wrap);

    const mo = new MutationObserver(() => start());
    mo.observe(root, { attributes: true, attributeFilter: ['data-intro'] });

    const onVisibility = () => {
      last = 0;
      schedule();
    };
    const onMove = (e: PointerEvent) => {
      pointer.cx = e.clientX;
      pointer.cy = e.clientY;
      pointer.active = true;
    };
    const onEnd = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') pointer.active = false;
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) pointer.active = false;
    };
    const onBlur = () => {
      pointer.active = false;
    };
    const opts = { passive: true } as const;
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointermove', onMove, opts);
    window.addEventListener('pointerdown', onMove, opts);
    window.addEventListener('pointerup', onEnd, opts);
    window.addEventListener('pointercancel', onEnd, opts);
    window.addEventListener('pointerout', onOut, opts);
    window.addEventListener('blur', onBlur);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      img.onload = null;
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      window.removeEventListener('pointerout', onOut);
      window.removeEventListener('blur', onBlur);
      wrap.removeAttribute('data-live');
      wrap.removeAttribute('data-formed');
    };
  }, [src]);

  return (
    <div ref={wrapRef} className="ds-particles" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
