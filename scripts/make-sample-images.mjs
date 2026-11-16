// Generates the clearly-labelled SAMPLE images used by the draft content, the
// customizer teaser and the default social image. They are illustrations,
// not photos of real work: replace them with real project photos.
//   node scripts/make-sample-images.mjs
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const W = 2000;
const H = 1250;
const OUT = 'src/assets/samples';
mkdirSync(OUT, { recursive: true });

const WALLS = {
  night: ['#0a0c11', '#1a1e29'],
  day: ['#d8d2c4', '#bfb8a8'],
  office: ['#eef0f3', '#d5d9df'],
  brick: ['#3a2622', '#22161a'],
  door: ['#5b3d2a', '#3b2619'],
  cafe: ['#141018', '#261a2c'],
};

const defs = (wall) => `
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${WALLS[wall][0]}"/><stop offset="1" stop-color="${WALLS[wall][1]}"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f4f5f7"/><stop offset=".5" stop-color="#8d939c"/><stop offset="1" stop-color="#e6e8eb"/>
    </linearGradient>
    <filter id="glowL" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="60"/></filter>
    <filter id="glowM" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="glowS" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
    <pattern id="bricks" width="160" height="80" patternUnits="userSpaceOnUse">
      <path d="M0 0H160M0 40H160M0 80H160M80 0V40M0 40V80M160 40V80" stroke="#00000055" stroke-width="5" fill="none"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#wall)"/>
  ${wall === 'brick' ? `<rect width="${W}" height="${H}" fill="url(#bricks)"/>` : ''}`;

const t = (text, { x = W / 2, y = 640, size = 230, weight = 900, fill = '#fff', extra = '', family = 'Inter' } = {}) =>
  `<text x="${x}" y="${y}" font-family="${family}" font-weight="${weight}" font-size="${size}" text-anchor="middle" fill="${fill}" ${extra}>${text}</text>`;

const extrude = (text, o, side, depth = 16) =>
  Array.from({ length: depth }, (_, i) => t(text, { ...o, x: (o.x ?? W / 2) + (depth - i) * 1.1, y: (o.y ?? 640) + (depth - i) * 1.4, fill: side })).join('');

const VARIANTS = {
  letters: ({ text, color = '#f5b301', side = '#7a5900' }) =>
    `${t(text, { fill: '#000', extra: 'filter="url(#soft)" opacity=".45"', y: 668 })}${extrude(text, {}, side)}${t(text, { fill: color })}`,
  frontlit: ({ text, color = '#fff6d6', glow = '#ffcf5a' }) =>
    `${t(text, { fill: glow, extra: 'filter="url(#glowL)" opacity=".8"' })}${extrude(text, {}, '#3b3320', 10)}${t(text, { fill: glow, extra: 'filter="url(#glowS)"' })}${t(text, { fill: color })}`,
  halo: ({ text, color = '#1c1f26', glow = '#59c8ff' }) =>
    `${t(text, { fill: glow, extra: 'filter="url(#glowL)"' })}${t(text, { fill: glow, extra: 'filter="url(#glowM)"' })}${t(text, { fill: color })}`,
  neon: ({ text, glow = '#ff2d95', size = 250 }) => {
    const o = { size, weight: 300, fill: 'none', family: 'Inter Display' };
    const s = (w, c, f = '') => t(text, { ...o, extra: `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" font-style="italic" ${f}` });
    return `<rect x="330" y="330" width="1340" height="520" rx="36" fill="#ffffff" opacity=".04" stroke="#ffffff22" stroke-width="3"/>
      ${s(22, glow, 'filter="url(#glowL)" opacity=".7"')}${s(16, glow, 'filter="url(#glowM)"')}${s(12, glow, 'filter="url(#glowS)"')}${s(5, '#ffffff')}`;
  },
  board: ({ text, color = '#12305c', ink = '#ffffff' }) =>
    `<rect x="250" y="250" width="1500" height="500" fill="#000" opacity=".35" filter="url(#soft)" transform="translate(0 22)"/>
     <rect x="250" y="250" width="1500" height="500" fill="${color}" stroke="url(#metal)" stroke-width="28"/>
     ${t(text, { fill: ink, y: 575, size: 210 })}
     <rect x="330" y="830" width="1340" height="420" fill="#00000030"/><path d="M330 900H1670M330 970H1670M330 1040H1670M330 1110H1670M330 1180H1670" stroke="#00000030" stroke-width="6"/>`,
  lightbox: ({ text, ink = '#b3141b' }) =>
    `<rect x="300" y="300" width="1400" height="480" rx="10" fill="#fff" filter="url(#glowL)" opacity=".75"/>
     <rect x="300" y="300" width="1400" height="480" rx="10" fill="#fdfdf8" stroke="#2a2d34" stroke-width="18"/>
     ${t(text, { fill: ink, y: 615, size: 210 })}`,
  nameplate: ({ text, sub = 'Designation' }) =>
    `<rect x="560" y="400" width="880" height="330" rx="14" fill="#000" opacity=".4" filter="url(#soft)" transform="translate(0 14)"/>
     <rect x="560" y="400" width="880" height="330" rx="14" fill="url(#metal)"/>
     <circle cx="600" cy="440" r="10" fill="#555"/><circle cx="1400" cy="440" r="10" fill="#555"/><circle cx="600" cy="690" r="10" fill="#555"/><circle cx="1400" cy="690" r="10" fill="#555"/>
     ${t(text, { fill: '#16181d', y: 575, size: 100, weight: 800 })}${t(sub, { fill: '#30343c', y: 655, size: 52, weight: 500 })}`,
  reception: ({ text, color = '#22252c' }) =>
    `<rect x="0" y="1010" width="${W}" height="240" fill="#00000018"/>
     <circle cx="560" cy="560" r="120" fill="#000" opacity=".25" filter="url(#soft)" transform="translate(8 12)"/><circle cx="560" cy="560" r="120" fill="#f5b301"/>
     ${t(text, { fill: '#000', x: 1160, y: 640, size: 190, extra: 'filter="url(#soft)" opacity=".3"' })}${extrude(text, { x: 1150, y: 630, size: 190 }, '#6c7079', 8)}${t(text, { fill: color, x: 1150, y: 630, size: 190 })}`,
  foam: ({ text, color = '#e8472b' }) =>
    `<rect x="420" y="300" width="1160" height="560" rx="6" fill="#000" opacity=".3" filter="url(#soft)" transform="translate(6 14)"/>
     <rect x="420" y="300" width="1160" height="560" rx="6" fill="${color}"/><rect x="420" y="300" width="1160" height="560" rx="6" fill="none" stroke="#ffffff55" stroke-width="6"/>
     ${t(text, { fill: '#fff', y: 640, size: 180 })}`,
};

const label = `
  <g font-family="Inter" font-weight="700">
    <rect x="40" y="${H - 110}" width="830" height="70" rx="35" fill="#000" opacity=".7"/>
    <text x="80" y="${H - 63}" font-size="34" fill="#fff" letter-spacing="2">SAMPLE IMAGE · NOT A REAL PROJECT</text>
  </g>`;

const svg = ({ wall, variant, ...opts }, withLabel = true) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(wall)}${VARIANTS[variant](opts)}${withLabel ? label : ''}</svg>`;

const IMAGES = {
  // Signage type heroes
  'type-3d-acrylic-letters': { wall: 'day', variant: 'letters', text: 'YOUR SHOP' },
  'type-led-backlit': { wall: 'night', variant: 'halo', text: 'YOUR BRAND' },
  'type-neon': { wall: 'cafe', variant: 'neon', text: 'Open late' },
  'type-acp-board': { wall: 'day', variant: 'board', text: 'SHOP NAME' },
  'type-light-box': { wall: 'night', variant: 'lightbox', text: 'PHARMACY' },
  'type-nameplate': { wall: 'door', variant: 'nameplate', text: 'Your Name' },
  'type-reception': { wall: 'office', variant: 'reception', text: 'BRAND' },
  'type-foam-board': { wall: 'office', variant: 'foam', text: 'WELCOME' },
  // Portfolio samples
  'project-shopfront-day': { wall: 'day', variant: 'letters', text: 'STORE', color: '#c8102e', side: '#5e0715' },
  'project-shopfront-night': { wall: 'night', variant: 'frontlit', text: 'STORE' },
  'project-cafe-neon': { wall: 'brick', variant: 'neon', text: 'Coffee', glow: '#ffb347' },
  'project-clinic-lightbox': { wall: 'night', variant: 'lightbox', text: 'CLINIC', ink: '#0b6b4f' },
  'project-office-halo': { wall: 'night', variant: 'halo', text: 'OFFICE', glow: '#ffffff', color: '#101216' },
  'project-office-reception': { wall: 'office', variant: 'reception', text: 'LOGO' },
  'project-acp-board': { wall: 'day', variant: 'board', text: 'TRADERS', color: '#0f4d3a' },
  'project-nameplate': { wall: 'door', variant: 'nameplate', text: 'House Name', sub: 'House No. · Street' },
  'project-neon-bedroom': { wall: 'cafe', variant: 'neon', text: 'Good vibes', glow: '#7df9ff' },
  // Home page
  'customizer-teaser': { wall: 'brick', variant: 'neon', text: 'Your Name', glow: '#ff2d95' },
};

for (const [name, spec] of Object.entries(IMAGES)) {
  // The teaser illustrates the sign designer, not a project, so it carries no label.
  await sharp(Buffer.from(svg(spec, name !== 'customizer-teaser'))).jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
  console.log('wrote', name);
}

// Default social image (1200×630). No business name on it until the owner supplies one.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><filter id="g" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="26"/></filter></defs>
  <rect width="1200" height="630" fill="#0e1014"/>
  <rect x="60" y="60" width="1080" height="510" rx="28" fill="none" stroke="#f5b301" stroke-width="6" filter="url(#g)"/>
  <rect x="60" y="60" width="1080" height="510" rx="28" fill="none" stroke="#f5b301" stroke-width="6"/>
  <text x="600" y="300" font-family="Inter" font-weight="900" font-size="92" fill="#fff" text-anchor="middle">Signboards in Jhang</text>
  <text x="600" y="390" font-family="Inter" font-weight="500" font-size="44" fill="#c9ced8" text-anchor="middle">3D letters · LED signs · Neon · Nameplates</text>
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9, palette: true }).toFile('public/og-default.png');
console.log('wrote og-default.png');
