// Copies the self-hosted WOFF2 files (and their licences) from the
// @fontsource dev dependencies into public/fonts. Run after adding a font:
//   node scripts/sync-fonts.mjs
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const out = 'public/fonts';
// package → files to copy (subset-weight)
const fonts = {
  'noto-nastaliq-urdu': ['arabic-400', 'latin-400'],
  gulzar: ['arabic-400', 'latin-400'],
  lalezar: ['arabic-400', 'latin-400'],
  'tilt-neon': ['latin-400'],
  neonderthaw: ['latin-400'],
  monoton: ['latin-400'],
  pacifico: ['latin-400'],
  sacramento: ['latin-400'],
  anton: ['latin-400'],
  'archivo-black': ['latin-400'],
  'bebas-neue': ['latin-400'],
  oswald: ['latin-700'],
  'alfa-slab-one': ['latin-400'],
  bungee: ['latin-400'],
};

mkdirSync(join(out, 'licenses'), { recursive: true });
for (const [pkg, files] of Object.entries(fonts)) {
  const dir = join('node_modules/@fontsource', pkg);
  for (const part of files) {
    const file = `${pkg}-${part}-normal.woff2`;
    copyFileSync(join(dir, 'files', file), join(out, file));
  }
  const licence = join(dir, 'LICENSE');
  if (existsSync(licence)) copyFileSync(licence, join(out, 'licenses', `${pkg}-LICENSE.txt`));
  console.log('synced', pkg);
}
