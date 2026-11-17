import { ARABIC_RANGE, LATIN_RANGE, getFont, type SignFont } from '../../../config/fonts';

const registered = new Map<string, Promise<void>>();
const ready = new Set<string>();

/**
 * Lazy-loads a customizer font with the FontFace API and resolves once the
 * browser can render `sampleText` with it. Safe to call repeatedly; unknown
 * families (system fallbacks) resolve at once.
 */
export function loadSignFont(family: string, sampleText = 'Aa'): Promise<void> {
  const font = getFont(family);
  if (!font) return Promise.resolve();

  let pending = registered.get(family);
  if (!pending) {
    pending = register(font);
    registered.set(family, pending);
  }
  // fonts.load() with the actual text makes sure every needed subset is in.
  return pending
    .then(() => document.fonts.load(`32px "${family}"`, sampleText || 'Aa'))
    .then(() => {
      ready.add(family);
    });
}

export function isFontReady(family: string): boolean {
  return ready.has(family) || !getFont(family);
}

async function register(font: SignFont): Promise<void> {
  const url = (file: string) => `url(/fonts/${file}) format("woff2")`;
  const faces = font.latinFile
    ? [
        new FontFace(font.family, url(font.file), { unicodeRange: ARABIC_RANGE, display: 'swap' }),
        new FontFace(font.family, url(font.latinFile), { unicodeRange: LATIN_RANGE, display: 'swap' }),
      ]
    : [new FontFace(font.family, url(font.file), { display: 'swap' })];

  for (const face of faces) document.fonts.add(face);
  // Load the main file now; the Latin part of an Urdu font loads when text needs it.
  await faces[0]!.load();
}
