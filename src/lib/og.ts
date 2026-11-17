/**
 * Per-page social images (1200 × 630), drawn at build time: the page title
 * in the brand font on the brand blue, with the logo sign beside it.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { site } from '../config/site';
import { getGuides, getProjects, getTypes } from './content';

const W = 1200;
const H = 630;
const root = process.cwd();
const FONT_TITLE = join(root, 'src/assets/fonts/og/Montserrat-Black.ttf');
const FONT_LABEL = join(root, 'src/assets/fonts/og/Michroma-Regular.ttf');
const LOGO = join(root, 'src/assets/brand/logo-sign-cutout.webp');

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Text as a transparent image, wrapped to `width`. */
async function text(markup: string, font: string, fontfile: string, width: number) {
  const { data, info } = await sharp({ text: { text: markup, font, fontfile, width, rgba: true, spacing: 6 } })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { data, height: info.height };
}

const BACKGROUND = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a4aa8"/><stop offset=".42" stop-color="#003783"/><stop offset="1" stop-color="#071d42"/>
    </linearGradient>
    <radialGradient id="a" cx="88%" cy="0%" r="60%"><stop offset="0" stop-color="#fca103" stop-opacity=".2"/><stop offset="1" stop-color="#fca103" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#a)"/>
  <rect x="64" y="${H - 96}" width="90" height="6" rx="3" fill="#fca103"/>
</svg>`);

export async function renderOgImage(title: string): Promise<Buffer> {
  const size = title.length > 42 ? 50 : title.length > 26 ? 58 : 68;
  const [eyebrow, heading, footer, logo] = await Promise.all([
    text(`<span foreground="#fca103" letter_spacing="3000">${escape(site.name.toUpperCase())}</span>`, 'Michroma 20', FONT_LABEL, 620),
    text(`<span foreground="#ffffff">${escape(title)}</span>`, `Montserrat SignDisplay ${size}`, FONT_TITLE, 640),
    text(`<span foreground="#dbe4f3">3D Signboards · LED · Neon · ${escape(site.address.city)}, Pakistan</span>`, 'Michroma 16', FONT_LABEL, 700),
    sharp(await readFile(LOGO)).resize({ width: 450 }).toBuffer(),
  ]);
  const headingTop = Math.max(150, Math.round((H - heading.height) / 2) - 10);
  return sharp(BACKGROUND)
    .composite([
      { input: eyebrow.data, left: 64, top: headingTop - 62 },
      { input: heading.data, left: 64, top: headingTop },
      { input: footer.data, left: 64, top: H - 66 },
      { input: logo, left: W - 450 - 40, top: Math.round((H - 272) / 2) },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}

let entries: Promise<Map<string, string>> | undefined;

/** Pages that get their own social image: path without slashes at the ends → title on the image. */
export function ogEntries(): Promise<Map<string, string>> {
  entries ??= (async () => {
    const map = new Map<string, string>([
      ['signage', 'Signboard types: 3D, LED, neon and more'],
      ['portfolio', 'Signboard portfolio'],
      ['guides', 'Signboard buying guides'],
      ['faq', 'Signboard questions and answers'],
      ['about', `About ${site.name}`],
      ['contact', `Contact ${site.name}`],
      ['design-your-sign', 'Design your sign online in English or Urdu'],
      ['signboards-in-jhang', `Signboards in ${site.address.city}`],
    ]);
    for (const type of await getTypes()) map.set(`signage/${type.id}`, type.data.title);
    for (const guide of await getGuides()) map.set(`guides/${guide.id}`, guide.data.title);
    for (const project of await getProjects()) map.set(`portfolio/${project.id}`, project.data.title);
    return map;
  })();
  return entries;
}

/** The social image for a page path, or undefined to use the default logo image. */
export async function ogImageFor(pathname: string): Promise<string | undefined> {
  const key = pathname.replace(/^\/|\/$/g, '');
  return (await ogEntries()).has(key) ? `/og/${key}.jpg` : undefined;
}
