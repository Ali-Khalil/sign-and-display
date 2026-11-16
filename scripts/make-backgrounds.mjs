// Generates the preset wall scenes for the sign customizer.
//   node scripts/make-backgrounds.mjs
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const W = 1600;
const H = 1200;
const OUT = 'public/customizer/backgrounds';
mkdirSync(OUT, { recursive: true });

const noise = `<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .09 0"/></filter>`;
const grad = (a, b) => `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const base = (a, b, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${grad(a, b)}${noise}</defs><rect width="${W}" height="${H}" fill="url(#g)"/>${extra}<rect width="${W}" height="${H}" filter="url(#n)"/></svg>`;

const SCENES = {
  'dark-wall': base('#23262d', '#15171c', `<rect y="1090" width="${W}" height="110" fill="#0d0e11"/>`),
  brick: base(
    '#7a4433',
    '#5c3024',
    `<defs><pattern id="b" width="120" height="60" patternUnits="userSpaceOnUse"><path d="M0 0H120M0 30H120M0 60H120M60 0V30M0 30V60M120 30V60" stroke="#2c1711" stroke-opacity=".6" stroke-width="5" fill="none"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#b)"/>`,
  ),
  plaster: base('#e6dfd0', '#cdc4b1', `<rect y="1100" width="${W}" height="100" fill="#b3aa97"/>`),
  'shopfront-night': base(
    '#10131a',
    '#1a1e28',
    `<rect x="0" y="250" width="${W}" height="16" fill="#0a0b0e"/><rect x="0" y="760" width="${W}" height="16" fill="#0a0b0e"/>
     <rect x="120" y="800" width="1360" height="400" fill="#2a2e38"/><path d="${Array.from({ length: 9 }, (_, i) => `M120 ${840 + i * 40}H1480`).join('')}" stroke="#16181e" stroke-width="5"/>
     <rect x="60" y="776" width="60" height="424" fill="#0d0f13"/><rect x="1480" y="776" width="60" height="424" fill="#0d0f13"/>`,
  ),
  office: base('#f1f2f4', '#dcdfe4', `<rect y="1040" width="${W}" height="160" fill="#c9cdd4"/><rect y="1030" width="${W}" height="12" fill="#b7bcc5"/>`),
};

for (const [name, svg] of Object.entries(SCENES)) {
  const image = sharp(Buffer.from(svg));
  await image.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
  await image.clone().resize(240).jpeg({ quality: 70, mozjpeg: true }).toFile(`${OUT}/${name}-thumb.jpg`);
  console.log('wrote', name);
}
