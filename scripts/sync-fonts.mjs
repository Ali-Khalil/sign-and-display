// Copies the self-hosted WOFF2 files (and their licences) from the
// @fontsource dev dependencies into public/fonts. Run after adding a font:
//   node scripts/sync-fonts.mjs
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const out = 'public/fonts';
const fonts = {
  'noto-nastaliq-urdu': ['arabic', 'latin'],
  gulzar: ['arabic', 'latin'],
  lalezar: ['arabic', 'latin'],
  anton: ['latin'],
  'tilt-neon': ['latin'],
};

mkdirSync(join(out, 'licenses'), { recursive: true });
for (const [pkg, subsets] of Object.entries(fonts)) {
  const dir = join('node_modules/@fontsource', pkg);
  for (const subset of subsets) {
    const file = `${pkg}-${subset}-400-normal.woff2`;
    copyFileSync(join(dir, 'files', file), join(out, file));
  }
  const licence = join(dir, 'LICENSE');
  if (existsSync(licence)) copyFileSync(licence, join(out, 'licenses', `${pkg}-LICENSE.txt`));
  console.log('synced', pkg);
}
