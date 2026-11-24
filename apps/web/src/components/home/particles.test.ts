import {
  brightness,
  countOpaque,
  createField,
  layoutField,
  sampleParticles,
  scatterField,
  stepForCount,
  stepParticles,
  type ImageLike,
} from './particles';

/** w×h RGBA image; `paint(x, y)` returns [r, g, b, a]. */
function makeImage(
  w: number,
  h: number,
  paint: (x: number, y: number) => [number, number, number, number],
): ImageLike {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set(paint(x, y), (y * w + x) * 4);
  return { data, width: w, height: h };
}

/** Deterministic PRNG so layouts are stable across runs. */
const rng =
  (seed = 1) =>
  () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

const stepFor = (secs: number, fn: () => void) => {
  for (let t = 0; t < secs; t += 1 / 60) fn();
};

describe('sampleParticles', () => {
  // Left half opaque white, right half transparent.
  const img = makeImage(20, 10, (x) => (x < 10 ? [255, 255, 255, 255] : [255, 255, 255, 0]));

  it('keeps only pixels whose alpha is above the threshold', () => {
    const pts = sampleParticles(img, { step: 1 });
    expect(pts).toHaveLength(10 * 10);
    expect(pts.every((p) => p.x < 10)).toBe(true);
    expect(countOpaque(img)).toBe(100);
  });

  it('treats alpha at the threshold as transparent', () => {
    const half = makeImage(4, 4, () => [0, 0, 0, 128]);
    expect(sampleParticles(half, { step: 1, alphaThreshold: 128 })).toHaveLength(0);
    expect(sampleParticles(half, { step: 1, alphaThreshold: 100 })).toHaveLength(16);
  });

  it('keeps one particle every `step` px', () => {
    expect(sampleParticles(img, { step: 2 })).toHaveLength(5 * 5);
    const pts = sampleParticles(img, { step: 5 });
    expect(pts.map((p) => [p.x, p.y])).toEqual([
      [2.5, 2.5],
      [7.5, 2.5],
      [2.5, 7.5],
      [7.5, 7.5],
    ]);
  });

  it('computes luminance 0–1 and floors brightness for dark pixels', () => {
    const bw = makeImage(2, 1, (x) => (x ? [255, 255, 255, 255] : [0, 0, 0, 255]));
    const [dark, light] = sampleParticles(bw, { step: 1 });
    expect(dark?.lum).toBe(0);
    expect(light?.lum).toBeCloseTo(1);
    expect(brightness(0)).toBeCloseTo(0.35);
    expect(brightness(1)).toBeCloseTo(1);
  });

  it('picks a step that hits the target count', () => {
    const big = makeImage(250, 360, () => [200, 200, 200, 255]);
    const step = stepForCount(countOpaque(big), 7000);
    const n = sampleParticles(big, { step }).length;
    expect(n).toBeGreaterThan(6000);
    expect(n).toBeLessThan(8000);
  });
});

describe('createField / layoutField', () => {
  it('groups particles into contiguous colour buckets covering every particle', () => {
    const img = makeImage(30, 30, (x, y) => [x * 8, y * 8, 100, 255]);
    const f = createField(sampleParticles(img, { step: 1 }), 30, 30, 1, rng());
    expect(f.count).toBe(900);
    let covered = 0;
    f.buckets.forEach((b, i) => {
      expect(b.start).toBe(i === 0 ? 0 : f.buckets[i - 1]!.end);
      covered += b.end - b.start;
    });
    expect(covered).toBe(900);
  });

  it('fits the image in the box (contain, bottom-aligned, centred)', () => {
    const img = makeImage(10, 20, () => [255, 255, 255, 255]);
    const f = createField(sampleParticles(img, { step: 1 }), 10, 20, 1, rng());
    layoutField(f, { x: 0, y: 0, w: 100, h: 100 }, true);
    // scale = 5, image is 50 wide → offset 25; bottom-aligned → y offset 0
    const xs = Array.from(f.hx);
    const ys = Array.from(f.hy);
    expect(Math.min(...xs)).toBeCloseTo(25 + 0.5 * 5);
    expect(Math.max(...xs)).toBeCloseTo(75 - 0.5 * 5);
    expect(Math.max(...ys)).toBeCloseTo(100 - 0.5 * 5);
    expect(f.x[0]).toBe(f.hx[0]);
  });
});

describe('stepParticles', () => {
  const single = () => {
    const img = makeImage(1, 1, () => [255, 255, 255, 255]);
    const f = createField(sampleParticles(img, { step: 1 }), 1, 1, 1, rng());
    layoutField(f, { x: 100, y: 100, w: 1, h: 1 }, true); // home = (100.5, 100.5)
    return f;
  };
  const dist = (f: ReturnType<typeof single>, x: number, y: number) =>
    Math.hypot(f.x[0]! - x, f.y[0]! - y);

  it('pushes a particle near the pointer out of the hole', () => {
    const f = single();
    const pointer = { x: 110, y: 100.5, radius: 90 };
    expect(dist(f, pointer.x, pointer.y)).toBeLessThan(10);
    stepFor(1.5, () => stepParticles(f, pointer, 1 / 60, { jitter: 0 }));
    expect(dist(f, pointer.x, pointer.y)).toBeGreaterThan(60);
    // Pushed away from the pointer (pointer is to the right → particle moves left).
    expect(f.x[0]!).toBeLessThan(100.5);
  });

  it('leaves particles outside the radius alone', () => {
    const f = single();
    stepFor(1, () => stepParticles(f, { x: 400, y: 400, radius: 90 }, 1 / 60, { jitter: 0 }));
    expect(dist(f, 100.5, 100.5)).toBeLessThan(0.01);
  });

  it('springs back home once the pointer leaves', () => {
    const f = single();
    const pointer = { x: 105, y: 100.5, radius: 90 };
    stepFor(1, () => stepParticles(f, pointer, 1 / 60, { jitter: 0 }));
    expect(dist(f, 100.5, 100.5)).toBeGreaterThan(40);
    stepFor(3, () => stepParticles(f, null, 1 / 60, { jitter: 0 }));
    expect(dist(f, 100.5, 100.5)).toBeLessThan(0.5);
  });

  it('assembles from the scattered intro state within ~1.2s of being released', () => {
    const img = makeImage(20, 30, () => [128, 128, 128, 255]);
    const f = createField(sampleParticles(img, { step: 1 }), 20, 30, 1, rng());
    layoutField(f, { x: 0, y: 0, w: 200, h: 300 }, true);
    scatterField(f, rng(7));
    let elapsed = 0;
    stepFor(1.6, () => {
      elapsed += 1 / 60;
      stepParticles(f, null, 1 / 60, { jitter: 0, elapsed });
    });
    let worst = 0;
    for (let i = 0; i < f.count; i++)
      worst = Math.max(worst, Math.hypot(f.x[i]! - f.hx[i]!, f.y[i]! - f.hy[i]!));
    expect(worst).toBeLessThan(3);
  });

  it('holds particles until their wake time', () => {
    const f = single();
    scatterField(f, rng(3));
    const [x0, y0] = [f.x[0], f.y[0]];
    stepParticles(f, null, 1 / 60, { elapsed: -1 });
    expect([f.x[0], f.y[0]]).toEqual([x0, y0]);
  });

  it('scatter moves particles outward and up from the figure', () => {
    const img = makeImage(20, 30, () => [128, 128, 128, 255]);
    const f = createField(sampleParticles(img, { step: 2 }), 20, 30, 2, rng());
    layoutField(f, { x: 0, y: 0, w: 200, h: 300 }, true);
    const meanY = (a: Float32Array) => a.reduce((s, v) => s + v, 0) / a.length;
    stepFor(2, () => stepParticles(f, null, 1 / 60, { jitter: 0, scatter: 1 }));
    expect(meanY(f.y)).toBeLessThan(meanY(f.hy) - 50);
  });
});
