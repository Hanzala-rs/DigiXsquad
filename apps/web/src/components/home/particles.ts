/**
 * Particle portrait math (no DOM): sample a transparent cut-out into dots, lay them out in a box,
 * and step a spring simulation (home spring + damping, pointer hole, idle jitter, scroll scatter).
 * Rendering lives in ParticlePortrait.tsx; everything here is pure so it can be unit-tested.
 *
 * Arrays are typed (Float32Array) and indexed by particle; particles are sorted by colour bucket
 * so the renderer can draw each bucket as one batched path.
 */

export type ImageLike = {
  data: ArrayLike<number>;
  width: number;
  height: number;
};

/** A sampled pixel in image space. `lum` is 0–1. `edge`: near the silhouette outline. */
export type SamplePoint = { x: number; y: number; lum: number; edge?: boolean };

export type SampleOptions = {
  /** Grid spacing in image pixels (may be fractional). */
  step: number;
  /** A pixel is a candidate if its alpha is above this (0–255). */
  alphaThreshold?: number;
  /**
   * If set, mark points that have a transparent pixel within this many image px (8 directions)
   * as `edge`: the glowing outline that stays visible over the photo.
   */
  edgeRadius?: number;
};

export type Box = { x: number; y: number; w: number; h: number };

export type Bucket = { start: number; end: number; color: string; alpha: number; edge: boolean };

export type ParticleField = {
  count: number;
  imgW: number;
  imgH: number;
  /** Sampling step the points were taken with (image px). */
  step: number;
  /** Image-space coords and luminance. */
  ix: Float32Array;
  iy: Float32Array;
  lum: Float32Array;
  /** Home (layout) position, current position and velocity, in box/canvas CSS px. */
  hx: Float32Array;
  hy: Float32Array;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  /** Square size in CSS px. */
  size: Float32Array;
  /** Per-particle random 0–1 (jitter phase, scatter amount, hole direction at dead centre). */
  seed: Float32Array;
  /** 1 if the particle is on the silhouette outline. */
  edge: Uint8Array;
  /** Seconds after the intro starts before this particle is released toward home. */
  wake: Float32Array;
  buckets: Bucket[];
  /** Centre of the laid-out figure and its height (for scatter). */
  cx: number;
  cy: number;
  boxH: number;
};

export type Pointer = { x: number; y: number; radius: number; strength?: number };

export type StepOptions = {
  /** Clock in seconds (drives jitter). */
  time?: number;
  /** Seconds since the intro started; particles wait until `elapsed >= wake`. */
  elapsed?: number;
  /** 0–1 scroll exit: pushes particles outward and up. */
  scatter?: number;
  /** Spring constant (1/s²). */
  stiffness?: number;
  /** Damping (1/s). */
  damping?: number;
  /** Idle jitter amplitude in px. */
  jitter?: number;
};

type RGB = readonly [number, number, number];

/** Brand oranges (#FF6A00, #FF9A1F, #E8440F) and the highlight bright pixels lean toward (#FFD2A6). */
export const PALETTE: { base: readonly RGB[]; weights: readonly number[]; light: RGB } = {
  base: [
    [255, 106, 0],
    [255, 154, 31],
    [232, 68, 15],
  ],
  weights: [0.5, 0.3, 0.2],
  light: [255, 210, 166],
};

/** Luminance levels used for colour buckets. */
export const LEVELS = 5;

const TAU = Math.PI * 2;

/** Brightness floor: dark pixels (the suit) still read as a silhouette. */
export const brightness = (lum: number) => 0.35 + 0.65 * lum;

export function countOpaque(img: ImageLike, alphaThreshold = 128): number {
  let n = 0;
  const { data } = img;
  for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > alphaThreshold) n++;
  return n;
}

/** Grid step that yields roughly `target` particles from `opaque` candidate pixels. */
export function stepForCount(opaque: number, target: number): number {
  if (opaque <= 0 || target <= 0) return 1;
  return Math.max(1, Math.sqrt(opaque / target));
}

/** Sample every `step` px on a grid, keeping pixels whose alpha is above the threshold. */
export function sampleParticles(img: ImageLike, opts: SampleOptions): SamplePoint[] {
  const { width: w, height: h, data } = img;
  const step = Math.max(1, opts.step);
  const thr = opts.alphaThreshold ?? 128;
  const er = opts.edgeRadius ?? 0;
  const transparentAt = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    // Below the image the figure continues (it is cut off there): not an outline.
    if (yi >= h) return false;
    if (xi < 0 || yi < 0 || xi >= w) return true;
    return (data[(yi * w + xi) * 4 + 3] ?? 0) <= thr;
  };
  const out: SamplePoint[] = [];
  for (let y = step / 2; y < h; y += step) {
    const py = Math.floor(y);
    for (let x = step / 2; x < w; x += step) {
      const i = (py * w + Math.floor(x)) * 4;
      if ((data[i + 3] ?? 0) <= thr) continue;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const point: SamplePoint = { x, y, lum: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 };
      if (er > 0) point.edge = isEdge(x, y, er, transparentAt);
      out.push(point);
    }
  }
  return out;
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.7071, 0.7071],
  [-0.7071, 0.7071],
  [0.7071, -0.7071],
  [-0.7071, -0.7071],
] as const;

/** True if a transparent pixel lies `r` px away in any of 8 directions. */
function isEdge(
  x: number,
  y: number,
  r: number,
  transparentAt: (x: number, y: number) => boolean,
): boolean {
  for (const [dx, dy] of DIRS) if (transparentAt(x + dx * r, y + dy * r)) return true;
  return false;
}

const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + ((b[i] ?? v) - v) * t)).join(' ')})`;

function pickHue(r: number): number {
  let acc = 0;
  for (let i = 0; i < PALETTE.weights.length; i++) {
    acc += PALETTE.weights[i] ?? 0;
    if (r < acc) return i;
  }
  return 0;
}

/**
 * Build a field from sampled points. Particles are grouped by colour bucket (hue × luminance
 * level). Positions are zero until `layoutField` places them.
 */
export function createField(
  points: SamplePoint[],
  imgW: number,
  imgH: number,
  step: number,
  rand: () => number = Math.random,
  /** 0–1: random offset inside each grid cell (0 = exact grid). */
  jitter = 0,
): ParticleField {
  // Bucket key: edge flag, then hue, then luminance level (edge dots get their own buckets so
  // the renderer can fade the interior without touching the outline).
  const perEdge = PALETTE.base.length * LEVELS;
  const tagged = points.map((p) => {
    const level = Math.min(LEVELS - 1, Math.floor(p.lum * LEVELS));
    return { p, bucket: (p.edge ? perEdge : 0) + pickHue(rand()) * LEVELS + level };
  });
  tagged.sort((a, b) => a.bucket - b.bucket);

  const n = tagged.length;
  const f32 = () => new Float32Array(n);
  const field: ParticleField = {
    count: n,
    imgW,
    imgH,
    step,
    ix: f32(),
    iy: f32(),
    lum: f32(),
    hx: f32(),
    hy: f32(),
    x: f32(),
    y: f32(),
    vx: f32(),
    vy: f32(),
    size: f32(),
    seed: f32(),
    edge: new Uint8Array(n),
    wake: f32(),
    buckets: [],
    cx: 0,
    cy: 0,
    boxH: 0,
  };

  let current = -1;
  tagged.forEach(({ p, bucket }, i) => {
    // Nudge each dot inside its grid cell so the portrait reads as scattered particles,
    // not a regular screen-door grid.
    field.ix[i] = jitter ? p.x + (rand() - 0.5) * step * jitter : p.x;
    field.iy[i] = jitter ? p.y + (rand() - 0.5) * step * jitter : p.y;
    field.lum[i] = p.lum;
    field.seed[i] = rand();
    field.edge[i] = p.edge ? 1 : 0;
    if (bucket !== current) {
      const edge = bucket >= perEdge;
      const key = bucket % perEdge;
      const hue = Math.floor(key / LEVELS);
      const lvl = (key % LEVELS) + 0.5;
      const l = lvl / LEVELS;
      const base = PALETTE.base[hue] ?? PALETTE.base[0]!;
      field.buckets.push({
        start: i,
        end: i,
        // The outline glows brighter and lighter than the interior dots.
        color: mix(base, PALETTE.light, edge ? 0.35 + l * 0.3 : Math.pow(l, 2) * 0.55),
        alpha: edge ? 0.95 : brightness(l),
        edge,
      });
      current = bucket;
    }
    field.buckets[field.buckets.length - 1]!.end = i + 1;
  });
  return field;
}

/**
 * Place the image inside `box` (contain, bottom-aligned, centred horizontally) and size the dots.
 * Keeps current positions unless `snap` is set.
 */
export function layoutField(field: ParticleField, box: Box, snap = false): void {
  const scale = Math.min(box.w / field.imgW, box.h / field.imgH);
  const ox = box.x + (box.w - field.imgW * scale) / 2;
  const oy = box.y + box.h - field.imgH * scale;
  const spacing = field.step * scale;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < field.count; i++) {
    const hx = ox + field.ix[i]! * scale;
    const hy = oy + field.iy[i]! * scale;
    field.hx[i] = hx;
    field.hy[i] = hy;
    field.size[i] = field.edge[i]
      ? Math.min(2.4, Math.max(1.1, spacing * 0.8)) // fine glow, not chunky squares on phones
      : Math.max(0.8, spacing * 0.78 * brightness(field.lum[i]!));
    sx += hx;
    sy += hy;
    if (snap) {
      field.x[i] = hx;
      field.y[i] = hy;
      field.vx[i] = 0;
      field.vy[i] = 0;
    }
  }
  field.cx = field.count ? sx / field.count : box.x + box.w / 2;
  field.cy = field.count ? sy / field.count : box.y + box.h / 2;
  field.boxH = field.imgH * scale;
}

/**
 * Intro start state: particles spread out and dropped below their home, released over
 * `spreadSecs` (staggered by seed) so the figure assembles from the bottom up.
 */
export function scatterField(
  field: ParticleField,
  rand: () => number = Math.random,
  spreadSecs = 0.35,
): void {
  const h = field.boxH;
  for (let i = 0; i < field.count; i++) {
    field.x[i] = field.hx[i]! + (rand() - 0.5) * h * 0.55;
    field.y[i] = field.hy[i]! + h * (0.3 + rand() * 0.55);
    field.vx[i] = 0;
    field.vy[i] = 0;
    // Lower particles wake first, plus a little randomness.
    const fromBottom = 1 - field.iy[i]! / field.imgH;
    field.wake[i] = (fromBottom * 0.6 + field.seed[i]! * 0.4) * spreadSecs;
  }
}

/**
 * Advance the simulation by `dt` seconds (clamped to 1/30 s for stability).
 * Each particle springs toward a target = home + jitter + scatter, pushed out of the pointer's
 * circle (radius × strength) with a smooth falloff, which leaves a visible hole.
 */
export function stepParticles(
  field: ParticleField,
  pointer: Pointer | null,
  dt: number,
  opts: StepOptions = {},
): void {
  const t = Math.min(Math.max(dt, 0), 1 / 30);
  if (t === 0) return;
  const k = opts.stiffness ?? 60;
  const c = opts.damping ?? 10;
  const time = opts.time ?? 0;
  const elapsed = opts.elapsed ?? Infinity;
  const scatter = Math.min(Math.max(opts.scatter ?? 0, 0), 1);
  const jitter = opts.jitter ?? 0.5;

  const R = pointer ? pointer.radius * Math.min(Math.max(pointer.strength ?? 1, 0), 1) : 0;
  const R2 = R * R;
  const px = pointer?.x ?? 0;
  const py = pointer?.y ?? 0;

  const spread = field.boxH * 0.55 * scatter;
  const lift = field.boxH * 0.45 * scatter;
  const { cx, cy, hx, hy, x, y, vx, vy, seed, wake } = field;

  for (let i = 0; i < field.count; i++) {
    if (elapsed < wake[i]!) continue;
    const s = seed[i]!;
    let tx = hx[i]!;
    let ty = hy[i]!;

    if (jitter) {
      tx += Math.sin(time * 1.7 + s * 41) * jitter;
      ty += Math.cos(time * 1.3 + s * 67) * jitter;
    }

    if (scatter > 0) {
      const dx = tx - cx;
      const dy = ty - cy;
      const d = Math.hypot(dx, dy) || 1;
      const m = spread * (0.35 + s);
      tx += (dx / d) * m;
      ty += (dy / d) * m * 0.6 - lift * (0.4 + ((s * 7.13) % 1));
    }

    if (R2 > 0) {
      let dx = tx - px;
      let dy = ty - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < R2) {
        let d = Math.sqrt(d2);
        if (d < 1e-3) {
          dx = Math.cos(s * TAU);
          dy = Math.sin(s * TAU);
          d = 1;
        }
        const q = 1 - d / R;
        const push = (R - d) * (0.55 + 0.45 * q);
        tx += (dx / d) * push;
        ty += (dy / d) * push;
      }
    }

    let vxi = vx[i]!;
    let vyi = vy[i]!;
    vxi += (k * (tx - x[i]!) - c * vxi) * t;
    vyi += (k * (ty - y[i]!) - c * vyi) * t;
    vx[i] = vxi;
    vy[i] = vyi;
    x[i] = x[i]! + vxi * t;
    y[i] = y[i]! + vyi * t;
  }
}

/* ───────── Photo dissolve ───────── */

const smooth = (t: number) => {
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * (3 - 2 * c);
};

/**
 * Opacity of the interior (non-outline) dots. They form the portrait during the intro, then
 * dissolve into the real photo `formAt` seconds in (over `fade` s). Scrolling the hero away
 * (`scatter`) brings them back as the photo fades, so the founder breaks up into particles.
 */
export function interiorAlpha(elapsed: number, scatter: number, formAt = 1.5, fade = 1): number {
  const dissolve = 1 - smooth((elapsed - formAt) / fade);
  return Math.max(dissolve, smooth(scatter * 2.5));
}

/* ───────── Embers: sparks rising around the figure ───────── */

export type Ember = {
  x: number;
  y: number;
  /** Rise speed (px/s). */
  vy: number;
  /** Seconds lived / total. */
  age: number;
  life: number;
  size: number;
  /** Sway phase. */
  phase: number;
};

/**
 * A new spark near the bottom of the figure box, in a band on either side of the figure so it
 * never drifts across the face or suit. `anywhere`: already mid-flight (initial fill).
 */
export function spawnEmber(box: Box, rand: () => number = Math.random, anywhere = false): Ember {
  const life = 2.6 + rand() * 2.6;
  const left = rand() < 0.5;
  return {
    x: box.x + box.w * (left ? 0.02 + rand() * 0.2 : 0.78 + rand() * 0.2),
    y: anywhere ? box.y + box.h * (0.25 + rand() * 0.75) : box.y + box.h * (0.92 + rand() * 0.1),
    vy: 28 + rand() * 46,
    age: anywhere ? rand() * life : 0,
    life,
    size: 1.2 + rand() * 1.8,
    phase: rand() * Math.PI * 2,
  };
}

/** Advance in place; returns false once the spark has burnt out. */
export function stepEmber(e: Ember, dt: number, time: number): boolean {
  e.age += dt;
  e.y -= e.vy * dt;
  e.x += Math.sin(time * 1.4 + e.phase) * 12 * dt;
  return e.age < e.life;
}

/** Fade in over the first 20% of life, out over the last 40%. */
export function emberAlpha(e: Ember): number {
  const t = e.age / e.life;
  if (t < 0.2) return t / 0.2;
  if (t > 0.6) return Math.max(0, (1 - t) / 0.4);
  return 1;
}
