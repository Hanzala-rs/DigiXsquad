// One-off asset script: turns the client's founder photo (plain white studio background)
// into a transparent cut-out plus a small mask the hero particle portrait samples.
//
//   node apps/web/scripts/make-founder-mask.mjs [source]
//
// Background removal = flood fill from the image border over near-white pixels, so white
// areas *inside* the figure (shirt, cuffs) stay opaque. Uses the sharp copy Next.js ships.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(createRequire(import.meta.url).resolve('next/package.json'));
const sharp = require('sharp');

const source = process.argv[2] ?? join(here, '../../../brand/founder-2026.jpg');
const outDir = join(here, '../public/brand');

const { data, info } = await sharp(source)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;

// 1. Near-white, low-saturation pixels can be background.
const candidate = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) {
  const r = data[i * 3];
  const g = data[i * 3 + 1];
  const b = data[i * 3 + 2];
  const lo = Math.min(r, g, b);
  const hi = Math.max(r, g, b);
  candidate[i] = lo > 218 && hi - lo < 24 ? 1 : 0;
}

// 2. Flood fill from every border pixel through candidates.
const bg = new Uint8Array(w * h);
const stack = [];
const push = (x, y) => {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = y * w + x;
  if (bg[i] || !candidate[i]) return;
  bg[i] = 1;
  stack.push(i);
};
for (let x = 0; x < w; x++) push(x, 0), push(x, h - 1);
for (let y = 0; y < h; y++) push(0, y), push(w - 1, y);
while (stack.length) {
  const i = stack.pop();
  const x = i % w;
  const y = (i - x) / w;
  push(x + 1, y), push(x - 1, y), push(x, y + 1), push(x, y - 1);
}

// 3. Alpha mask, eroded 1px to drop the white fringe, then softened.
const alpha = Buffer.alloc(w * h);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const nearBg =
      bg[i] ||
      (x > 0 && bg[i - 1]) ||
      (x < w - 1 && bg[i + 1]) ||
      (y > 0 && bg[i - w]) ||
      (y < h - 1 && bg[i + w]);
    alpha[i] = nearBg ? 0 : 255;
  }
}
const soft = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } })
  .blur(0.8)
  .extractChannel(0)
  .raw()
  .toBuffer({ resolveWithObject: true });
if (soft.info.channels !== 1) throw new Error(`expected 1 alpha channel, got ${soft.info.channels}`);
const softAlpha = soft.data;

// Bounding box of the figure, so the output has no empty margins.
let [x0, y0, x1, y1] = [w, h, 0, 0];
const rgba = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {
  rgba[i * 4] = data[i * 3];
  rgba[i * 4 + 1] = data[i * 3 + 1];
  rgba[i * 4 + 2] = data[i * 3 + 2];
  rgba[i * 4 + 3] = softAlpha[i];
  if (softAlpha[i] > 8) {
    const x = i % w;
    const y = (i - x) / w;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
}
const cutoutBuf = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
  .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
  .png()
  .toBuffer();

// Display image for next/image (hero fallback + team card).
const full = await sharp(cutoutBuf)
  .resize({ height: 1100, withoutEnlargement: true })
  .webp({ quality: 82, alphaQuality: 90 })
  .toFile(join(outDir, 'founder-cutout.webp'));
// Small source the particle sampler reads with getImageData (one pixel ≈ one particle slot).
const small = await sharp(cutoutBuf)
  .resize({ height: 360 })
  .png({ compressionLevel: 9 })
  .toFile(join(outDir, 'founder-particles.png'));

console.log(`founder-cutout.webp ${full.width}x${full.height} (${full.size} B)`);
console.log(`founder-particles.png ${small.width}x${small.height} (${small.size} B)`);
