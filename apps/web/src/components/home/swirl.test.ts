import { describe, expect, it } from 'vitest';
import { advance, flow, makeVortices, spawnStreak, streakCount, type Vortex } from './swirl';

const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

describe('swirl flow field', () => {
  it('drifts left to right when there are no vortices', () => {
    for (const [x, y] of [
      [0, 0],
      [300, 120],
      [900, 640],
    ] as const) {
      expect(flow(x, y, 0, [])[0]).toBeGreaterThan(0);
    }
  });

  it('a vortex spins points around its centre in its own direction', () => {
    const ccw: Vortex = { x: 500, y: 500, r: 100, s: 1 };
    const cw: Vortex = { ...ccw, s: -1 };
    // Directly above the centre (dy < 0), a positive spin pushes right (+x), a negative one left.
    const base = flow(500, 450, 0, [])[0];
    expect(flow(500, 450, 0, [ccw])[0]).toBeGreaterThan(base);
    expect(flow(500, 450, 0, [cw])[0]).toBeLessThan(base);
  });

  it('vortex influence fades with distance', () => {
    const v: Vortex = { x: 0, y: 0, r: 80, s: 1 };
    const near = Math.abs(flow(0, 40, 0, [v])[0] - flow(0, 40, 0, [])[0]);
    const far = Math.abs(flow(0, 600, 0, [v])[0] - flow(0, 600, 0, [])[0]);
    expect(near).toBeGreaterThan(far * 100);
  });

  it('uses fewer vortices on narrow screens and keeps them inside the canvas', () => {
    const rand = seq([0.1, 0.5, 0.9, 0.3]);
    expect(makeVortices(400, 800, rand)).toHaveLength(4);
    const wide = makeVortices(1440, 900, rand);
    expect(wide).toHaveLength(7);
    for (const v of wide) {
      expect(v.x).toBeGreaterThanOrEqual(1440 * 0.25);
      expect(v.x).toBeLessThanOrEqual(1440);
      expect(v.y).toBeLessThanOrEqual(900);
    }
  });

  it('caps the streak count on large screens', () => {
    expect(streakCount(375, 812)).toBe(Math.round((375 * 812) / 1100));
    expect(streakCount(3840, 2160)).toBe(1400);
  });

  it('streaks move, age, and ask to respawn when off-canvas or expired', () => {
    const p = spawnStreak(800, 600, seq([0.5, 0.5, 0]));
    expect(p).toEqual({ x: 400, y: 300, life: 60 });
    expect(advance(p, 0, [], 800, 600)).toBe(true);
    expect(p.x).toBeGreaterThan(400);
    expect(p.life).toBe(59);

    const edge = { x: 809, y: 300, life: 100 };
    expect(advance(edge, 0, [], 800, 600)).toBe(false);
    const old = { x: 100, y: 100, life: 0 };
    expect(advance(old, 0, [], 800, 600)).toBe(false);
  });
});
