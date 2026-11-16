// Builds the wall scenes for the sign designer.
//   node scripts/make-backgrounds.mjs            rebuild the drawn scene only
//   node scripts/make-backgrounds.mjs --photos   also re-download the wall photos
//
// The wall photos are openly licensed (CC0 / CC BY) pictures from Flickr;
// their credits are in src/config/credits.ts and shown on /credits/.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const W = 1600;
const H = 1200;
const OUT = 'public/customizer/backgrounds';
mkdirSync(OUT, { recursive: true });

async function save(image, name, quality = 70) {
  await image.clone().webp({ quality }).toFile(`${OUT}/${name}.webp`);
  await image.clone().resize(240).webp({ quality: 65 }).toFile(`${OUT}/${name}-thumb.webp`);
  console.log('wrote', name);
}

// name → Flickr photo (the "_b" file is the 1024px size) and an optional tone change.
const PHOTOS = {
  brick: { url: 'https://live.staticflickr.com/6173/6186285060_048f4af0af_b.jpg' },
  'old-brick': { url: 'https://live.staticflickr.com/3851/15052672122_d5eca12092_b.jpg', brightness: 0.7 },
  plaster: { url: 'https://live.staticflickr.com/3313/3508863709_4a4104e77e_b.jpg', brightness: 1.08, blur: 1.8 },
  concrete: { url: 'https://live.staticflickr.com/5033/14618584163_c794fdefb4_b.jpg' },
  'dark-wall': { url: 'https://live.staticflickr.com/3887/14596575894_f63711d59b_b.jpg', brightness: 0.32, saturation: 0.6 },
  office: { url: 'https://live.staticflickr.com/3132/3086990547_2426c40ca6_b.jpg', brightness: 1.45, saturation: 0.35, blur: 1.6 },
};

if (process.argv.includes('--photos')) {
  for (const [name, photo] of Object.entries(PHOTOS)) {
    const raw = execFileSync('curl', ['-sS', '-f', '-m', '60', '-A', 'signage-site-build/0.1', photo.url], { maxBuffer: 64 * 1024 * 1024 });
    const image = sharp(raw)
      .resize(W, H, { fit: 'cover' })
      // The photos are enlarged from 1024px; a light blur removes grain that would bloat the files.
      .blur(photo.blur ?? 0.9)
      .modulate({ brightness: photo.brightness ?? 1, saturation: photo.saturation ?? 1 });
    await save(sharp(await image.toBuffer()), name, 52);
    await new Promise((r) => setTimeout(r, 800));
  }
}

// One drawn scene: a closed shopfront at night.
const shopfront = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10131a"/><stop offset="1" stop-color="#1a1e28"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="250" width="${W}" height="16" fill="#0a0b0e"/><rect x="0" y="760" width="${W}" height="16" fill="#0a0b0e"/>
  <rect x="120" y="800" width="1360" height="400" fill="#2a2e38"/>
  <path d="${Array.from({ length: 9 }, (_, i) => `M120 ${840 + i * 40}H1480`).join('')}" stroke="#16181e" stroke-width="5"/>
  <rect x="60" y="776" width="60" height="424" fill="#0d0f13"/><rect x="1480" y="776" width="60" height="424" fill="#0d0f13"/>
</svg>`;
await save(sharp(Buffer.from(shopfront)), 'shopfront-night');
