// Cuts the logo sign out of its dark wall so it can sit on any background.
// The wall is near-black, so brightness is used as the mask: the wall becomes
// transparent, the letters stay solid, and the glow fades out smoothly.
//   node scripts/make-logo-cutout.mjs
import sharp from 'sharp';

const SRC = 'src/assets/brand/logo-sign.webp';
const OUT = 'src/assets/brand/logo-sign-cutout.webp';
const CROP = { left: 110, top: 300, width: 1094, height: 660 };
const WALL = 56; // at or below this brightness: fully transparent
const SOLID = 122; // at or above: fully opaque

const { data, info } = await sharp(SRC).extract(CROP).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const C = info.channels;
const pixels = info.width * info.height;
const alpha = Buffer.alloc(pixels);
for (let p = 0; p < pixels; p++) {
  const max = Math.max(data[p * C], data[p * C + 1], data[p * C + 2]);
  alpha[p] = Math.round(255 * Math.min(1, Math.max(0, (max - WALL) / (SOLID - WALL))));
}
// Soften the mask a little so edges do not look cut with scissors.
const blurred = await sharp(alpha, { raw: { width: info.width, height: info.height, channels: 1 } })
  .blur(1.2)
  .raw()
  .toBuffer({ resolveWithObject: true });
const SC = blurred.info.channels;
const rgba = Buffer.alloc(pixels * 4);
for (let p = 0; p < pixels; p++) {
  const a8 = blurred.data[p * SC];
  const a = a8 / 255;
  // The picture is the sign blended over black; divide the black back out of the faded parts.
  const lift = a >= 1 ? 1 : a > 0.02 ? Math.min(1 / a, 2.2) : 0;
  rgba[p * 4] = Math.min(255, data[p * C] * lift);
  rgba[p * 4 + 1] = Math.min(255, data[p * C + 1] * lift);
  rgba[p * 4 + 2] = Math.min(255, data[p * C + 2] * lift);
  rgba[p * 4 + 3] = a8;
}
await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ quality: 90, alphaQuality: 90 }).toFile(OUT);
console.log('wrote', OUT, `(${C} channels in, mask ${SC})`);
