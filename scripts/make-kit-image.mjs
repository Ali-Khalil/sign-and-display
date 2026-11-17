// Draws the example welcome-kit picture used on /welcome-kits/: a branded box
// with a mug, water bottle, notepad and pencils, each carrying a placeholder
// logo. It is an illustration, labelled as an example, not a photo of a real
// order.  Run: node scripts/make-kit-image.mjs
import sharp from 'sharp';

const W = 1600;
const H = 1000;
const BLUE = '#003783';
const NAVY = '#0b2a5c';
const AMBER = '#fca103';

/** Placeholder logo, centred on (x, y): a small amber mark and the words YOUR LOGO (about 242 units wide). */
const mark = `<rect x="-20" y="-20" width="40" height="40" rx="9" fill="${AMBER}"/>
  <path d="M-8 -6h16M-8 2h11M-8 10h16" stroke="${BLUE}" stroke-width="4" stroke-linecap="round"/>`;
const logo = (x, y, s = 1, ink = '#ffffff') => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <g transform="translate(-101 0)">${mark}</g>
    <text x="-69" y="11" font-family="Inter Display, Inter, Arial" font-weight="900" font-size="30" fill="${ink}" letter-spacing="1">YOUR LOGO</text>
  </g>`;
/** Just the mark, for narrow items. */
const markOnly = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${mark}</g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#f6f8fc"/><stop offset="1" stop-color="#d7deea"/></radialGradient>
    <linearGradient id="box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a4aa8"/><stop offset="1" stop-color="${NAVY}"/></linearGradient>
    <linearGradient id="boxIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06204a"/><stop offset="1" stop-color="#0d356f"/></linearGradient>
    <linearGradient id="lid" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${NAVY}"/><stop offset=".5" stop-color="#0a4aa8"/><stop offset="1" stop-color="${NAVY}"/></linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa6b6"/><stop offset=".25" stop-color="#f4f6f9"/><stop offset=".55" stop-color="#cfd6e0"/><stop offset="1" stop-color="#7e8a9b"/></linearGradient>
    <linearGradient id="mug" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dfe4ec"/><stop offset=".3" stop-color="#ffffff"/><stop offset="1" stop-color="#c9d0db"/></linearGradient>
    <linearGradient id="pencil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc24d"/><stop offset=".5" stop-color="${AMBER}"/><stop offset="1" stop-color="#c97b00"/></linearGradient>
    <linearGradient id="note" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d4fae"/><stop offset="1" stop-color="${NAVY}"/></linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- shadows on the table -->
  <ellipse cx="800" cy="842" rx="560" ry="40" fill="#0b1f44" opacity=".28" filter="url(#shadow)"/>

  <!-- lid leaning behind the box -->
  <g transform="translate(330 170) rotate(-7)">
    <rect x="0" y="0" width="760" height="300" rx="10" fill="url(#lid)"/>
    <rect x="0" y="236" width="760" height="22" fill="${AMBER}" opacity=".95"/>
    ${logo(450, 118, 1.3)}
  </g>

  <!-- inside of the open box -->
  <path d="M300 470 L1300 470 L1250 540 L350 540 Z" fill="url(#boxIn)"/>

  <!-- water bottle, standing in the box -->
  <g transform="translate(470 175)">
    <rect x="18" y="0" width="64" height="34" rx="8" fill="#2a3240"/>
    <rect x="26" y="30" width="48" height="26" fill="#3a4454"/>
    <path d="M10 56 h80 v12 q14 24 14 44 v300 h-108 v-300 q0 -20 14 -44 z" fill="url(#steel)"/>
    <rect x="-4" y="200" width="108" height="130" fill="${BLUE}"/>
    ${markOnly(50, 255, 1.3)}
  </g>

  <!-- notepad, standing in the box -->
  <g transform="translate(980 205) rotate(6)">
    <rect x="0" y="0" width="250" height="330" rx="10" fill="url(#note)"/>
    <rect x="0" y="0" width="22" height="330" fill="#06204a" opacity=".5"/>
    ${Array.from({ length: 9 }, (_, i) => `<circle cx="11" cy="${28 + i * 35}" r="5" fill="#cfd6e0"/>`).join('')}
    ${logo(136, 130, 0.78)}
    <rect x="50" y="250" width="170" height="8" rx="4" fill="${AMBER}"/>
  </g>

  <!-- front of the box -->
  <path d="M300 470 L1300 470 L1300 830 L300 830 Z" fill="url(#box)"/>
  <rect x="300" y="470" width="1000" height="10" fill="#ffffff" opacity=".18"/>
  ${logo(860, 650, 2.4)}
  <rect x="300" y="790" width="1000" height="40" fill="#000000" opacity=".12"/>

  <!-- mug, in front of the box -->
  <g transform="translate(150 560)">
    <ellipse cx="120" cy="268" rx="125" ry="20" fill="#0b1f44" opacity=".3" filter="url(#soft)"/>
    <path d="M232 70 q78 0 78 78 q0 78 -78 78" fill="none" stroke="#d8dee8" stroke-width="30"/>
    <path d="M0 30 h240 v200 q0 40 -40 40 h-160 q-40 0 -40 -40 z" fill="url(#mug)"/>
    <ellipse cx="120" cy="30" rx="120" ry="22" fill="#eef1f6"/>
    <ellipse cx="120" cy="32" rx="104" ry="16" fill="#3a2418"/>
    ${logo(112, 150, 0.82, BLUE)}
  </g>

  <!-- pencils, lying in front -->
  ${[0, 1, 2]
    .map(
      (i) => `<g transform="translate(${930 + i * 18} ${872 + i * 30}) rotate(-4)">
      <rect x="0" y="0" width="430" height="24" fill="url(#pencil)"/>
      <rect x="0" y="0" width="40" height="24" fill="#d9dee6"/><rect x="-26" y="0" width="28" height="24" rx="6" fill="#e86f8a"/>
      <path d="M430 0 L478 12 L430 24 Z" fill="#f0d2a8"/><path d="M466 9 L478 12 L466 15 Z" fill="#2a3240"/>
      <text x="80" y="18" font-family="Inter Display, Inter, Arial" font-weight="900" font-size="15" fill="${BLUE}" letter-spacing="2">YOUR LOGO</text>
    </g>`,
    )
    .join('')}

  <!-- label -->
  <rect x="40" y="${H - 86}" width="300" height="52" rx="26" fill="#000" opacity=".66"/>
  <text x="70" y="${H - 51}" font-family="Inter, Arial" font-weight="700" font-size="24" fill="#fff" letter-spacing="2">EXAMPLE KIT</text>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 86, mozjpeg: true }).toFile('src/assets/brand/welcome-kit-example.jpg');
console.log('wrote src/assets/brand/welcome-kit-example.jpg');
