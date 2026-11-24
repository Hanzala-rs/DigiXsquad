/**
 * Flow-field maths for the home page "swirl" background (no DOM, unit-tested).
 *
 * A gentle left-to-right wind made of slow sine waves, plus a few Gaussian vortices that
 * bend it into eddies. Points ride the field and the canvas draws each step as a short line;
 * fading the previous frame a little leaves long, curling streaks.
 */

export type Vortex = {
  x: number;
  y: number;
  /** Radius of influence (px). */
  r: number;
  /** Spin: sign = direction, magnitude = strength. */
  s: number;
};

export type Streak = { x: number; y: number; life: number };

type Rand = () => number;

/** Fewer, smaller eddies on narrow screens. Biased to the right so headings on the left stay calm. */
export function makeVortices(w: number, h: number, rand: Rand = Math.random): Vortex[] {
  const n = w < 700 ? 4 : 7;
  return Array.from({ length: n }, () => ({
    x: w * (0.25 + rand() * 0.75),
    y: rand() * h,
    r: (w < 700 ? 70 : 90) + rand() * 170,
    s: (rand() < 0.5 ? -1 : 1) * (0.7 + rand() * 0.6),
  }));
}

/** About one streak per 1100 px², capped so big screens stay cheap. */
export const streakCount = (w: number, h: number) => Math.min(1400, Math.round((w * h) / 1100));

export function spawnStreak(w: number, h: number, rand: Rand = Math.random): Streak {
  return { x: rand() * w, y: rand() * h, life: 60 + rand() * 160 };
}

/** Velocity of the field at (x, y) and time t (seconds-ish). */
export function flow(
  x: number,
  y: number,
  t: number,
  vortices: readonly Vortex[],
): [number, number] {
  let vx = 0.55 + 0.35 * Math.sin(y * 0.007 + t);
  let vy = 0.3 * Math.cos(x * 0.005 - t * 0.7);
  for (const v of vortices) {
    const dx = x - v.x;
    const dy = y - v.y;
    const f = v.s * Math.exp(-(dx * dx + dy * dy) / (v.r * v.r)) * 2.6;
    // Perpendicular to the radius = rotation around the vortex centre.
    vx += (-dy / v.r) * f;
    vy += (dx / v.r) * f;
  }
  return [vx, vy];
}

/** Advance one streak in place. Returns false when it should be respawned. */
export function advance(
  p: Streak,
  t: number,
  vortices: readonly Vortex[],
  w: number,
  h: number,
  speed = 1.6,
): boolean {
  const [vx, vy] = flow(p.x, p.y, t, vortices);
  p.x += vx * speed;
  p.y += vy * speed;
  p.life -= 1;
  return p.life >= 0 && p.x >= -10 && p.x <= w + 10 && p.y >= -10 && p.y <= h + 10;
}
