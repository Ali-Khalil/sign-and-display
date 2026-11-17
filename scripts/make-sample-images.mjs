// Renders example pictures with the site's own sign designer, on the real wall
// photos: one per signage type and one per example portfolio project, each
// tagged "example design". None of them are photos of real work.
//   pnpm build:preview && node scripts/make-sample-images.mjs
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { startPreview } from './lib/preview.mjs';

const OUT = 'src/assets/samples';
mkdirSync(OUT, { recursive: true });

const NARROW = ['Anton', 'Bebas Neue', 'Oswald', 'Sacramento', 'Neonderthaw'];
let counter = 0;

const board = (o = {}) => ({ widthIn: 96, heightIn: 36, style: 'none', shape: 'rect', color: '#12305c', border: false, finish: 'gloss', backlit: false, ...o });

/** A line of text placed at a share of the sign area's height (same maths as the designer's templates). */
function line(b, text, at, share, o = {}) {
  const k = Math.min(1000 / b.widthIn, 600 / b.heightIn);
  const w = b.widthIn * k;
  const h = b.heightIn * k;
  const font = o.fontFamily ?? 'Montserrat Black';
  const fontSize = Math.round(Math.min(h * share, (w * 0.82) / (text.length * (NARROW.includes(font) ? 0.5 : 0.7))));
  return { id: `s${counter++}`, type: 'text', text, fontFamily: font, fontSize, x: 600, y: 420 - h / 2 + h * at, ...o };
}

function design(mode, wall, night, b, layers, extra = {}) {
  return { app: 'sign-designer', version: 1, mode, lighting: 'front-lit', view: 'right', lit: true, flicker: false, night, board: b, background: { kind: 'preset', id: wall }, layers, ...extra };
}

function build() {
  const wide = board({ widthIn: 120, heightIn: 30 });
  const shop = board({ widthIn: 120, heightIn: 36, style: 'solid', border: true });
  const box = board({ widthIn: 72, heightIn: 26, style: 'solid', color: '#f7f7f4', shape: 'rounded', finish: 'matte', backlit: true });
  const plate = board({ widthIn: 14, heightIn: 5, style: 'solid', color: '#b9bec6', shape: 'rounded', finish: 'gloss' });
  const neon = board({ widthIn: 36, heightIn: 16, style: 'clear', shape: 'rounded', finish: 'matte' });
  const foam = board({ widthIn: 48, heightIn: 24, style: 'solid', color: '#f26b1d', finish: 'matte' });

  return {
    // Signage type pages
    'type-3d-acrylic-letters': design('3d-letters', 'plaster', false, wide, [line(wide, 'YOUR SHOP', 0.5, 0.7, { color: '#f5b301', depth: 0.2 })]),
    'type-led-backlit': design('led', 'dark-wall', true, wide, [line(wide, 'YOUR BRAND', 0.5, 0.7, { color: '#1c1f26', glow: '#7df9ff' })], { lighting: 'halo' }),
    'type-neon': design('neon', 'dark-wall', true, neon, [line(neon, 'Open late', 0.5, 0.5, { fontFamily: 'Pacifico', glow: '#ff2d95' })]),
    'type-acp-board': design('flat-board', 'plaster', false, shop, [
      line(shop, 'SHOP NAME', 0.42, 0.44, { color: '#ffffff' }),
      line(shop, 'Mobile: 0300-1234567', 0.8, 0.15, { fontFamily: 'Oswald', color: '#f5b301' }),
    ]),
    'type-light-box': design('flat-board', 'dark-wall', true, box, [line(box, 'PHARMACY', 0.5, 0.5, { color: '#b3141b' })]),
    'type-nameplate': design('flat-board', 'office', false, plate, [
      line(plate, 'Your Name', 0.4, 0.36, { fontFamily: 'Oswald', color: '#16181d' }),
      line(plate, 'Designation', 0.78, 0.18, { fontFamily: 'Oswald', color: '#16181d' }),
    ]),
    'type-reception': design('3d-letters', 'office', false, wide, [line(wide, 'BRAND', 0.5, 0.75, { color: '#16181d', depth: 0.12 })]),
    'type-foam-board': design('flat-board', 'office', false, foam, [line(foam, 'WELCOME', 0.5, 0.36, { color: '#ffffff' })]),

    // Sample portfolio projects
    'project-shopfront-day': design('3d-letters', 'plaster', false, wide, [line(wide, 'STORE', 0.5, 0.8, { color: '#d0202a', depth: 0.2 })]),
    'project-shopfront-night': design('led', 'shopfront-night', true, wide, [line(wide, 'STORE', 0.5, 0.8, { color: '#d0202a', glow: '#ff2a2a', depth: 0.2 })]),
    'project-cafe-neon': design('neon', 'old-brick', true, neon, [line(neon, 'Coffee', 0.5, 0.56, { fontFamily: 'Pacifico', glow: '#ff8a1f' })]),
    'project-clinic-lightbox': design('flat-board', 'dark-wall', true, box, [line(box, 'CLINIC', 0.5, 0.56, { color: '#0f7a4d' })]),
    'project-office-halo': design('led', 'dark-wall', true, wide, [line(wide, 'OFFICE', 0.5, 0.8, { color: '#16181d', glow: '#eaf4ff' })], { lighting: 'halo' }),
    'project-office-reception': design('3d-letters', 'office', false, wide, [line(wide, 'LOGO', 0.5, 0.8, { color: '#1f4fbf', depth: 0.14 })]),
    'project-acp-board': design('flat-board', 'plaster', false, { ...shop, color: '#0f4d3a', finish: 'glitter' }, [line(shop, 'TRADERS', 0.5, 0.5, { color: '#ffffff' })]),
    'project-nameplate': design('flat-board', 'plaster', false, plate, [
      line(plate, 'House Name', 0.4, 0.36, { fontFamily: 'Oswald', color: '#16181d' }),
      line(plate, 'House No. · Street', 0.78, 0.18, { fontFamily: 'Oswald', color: '#16181d' }),
    ]),
    'project-neon-bedroom': design('neon', 'dark-wall', true, neon, [line(neon, 'Good vibes', 0.5, 0.5, { fontFamily: 'Tilt Neon', glow: '#7df9ff' })]),
  };
}

// Every picture is tagged as an example design. The tag sits 200px in, so it
// survives the 4:3 crop the portfolio cards use.
const label = (text, width) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1250">
  <rect x="200" y="1140" width="${width}" height="70" rx="35" fill="#000" opacity=".72"/>
  <text x="240" y="1187" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="34" fill="#fff" letter-spacing="2">${text}</text>
</svg>`);
const EXAMPLE_LABEL = label('EXAMPLE DESIGN', 400);

const server = await startPreview(4397);
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${server.url}/design-your-sign/`);
  for (const [name, d] of Object.entries(build())) {
    await page.evaluate((json) => localStorage.setItem('signDesigner.v1', json), JSON.stringify(d));
    await page.goto(`${server.url}/design-your-sign/`);
    await page.locator('[data-sign-designer]').waitFor();
    // Wait for the wall photo and the fonts before taking the picture.
    await page.waitForFunction(() => window.__signDesigner?.scene.canvas.backgroundImage);
    await page.waitForTimeout(1300);
    const url = await page.evaluate(() => window.__signDesigner.scene.toPNG(2000));
    await sharp(Buffer.from(url.split(',')[1], 'base64'))
      .extract({ left: 0, top: 75, width: 2000, height: 1250 })
      .composite([{ input: EXAMPLE_LABEL }])
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(`${OUT}/${name}.jpg`);
    console.log('wrote', name);
  }
} finally {
  await browser.close();
  server.stop();
}
