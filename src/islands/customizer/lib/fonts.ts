import { ARABIC_RANGE, LATIN_RANGE, signFonts, type SignFont } from '../../../config/fonts';

const loaded = new Map<string, Promise<void>>();

/**
 * Lazy-loads a customizer font with the FontFace API and resolves once the
 * browser can render `sampleText` with it. Safe to call repeatedly.
 */
export function loadSignFont(family: string, sampleText = 'Aa'): Promise<void> {
  const font = signFonts.find((f) => f.family === family);
  if (!font) return Promise.reject(new Error(`Unknown sign font: ${family}`));

  let registered = loaded.get(family);
  if (!registered) {
    registered = register(font);
    loaded.set(family, registered);
  }
  // fonts.load() with the actual text makes sure every needed subset is in.
  return registered.then(() => document.fonts.load(`32px "${family}"`, sampleText)).then(() => {});
}

async function register(font: SignFont): Promise<void> {
  const faces = font.latinFile
    ? [
        new FontFace(font.family, `url(/fonts/${font.file}) format("woff2")`, {
          unicodeRange: ARABIC_RANGE,
          display: 'swap',
        }),
        new FontFace(font.family, `url(/fonts/${font.latinFile}) format("woff2")`, {
          unicodeRange: LATIN_RANGE,
          display: 'swap',
        }),
      ]
    : [new FontFace(font.family, `url(/fonts/${font.file}) format("woff2")`, { display: 'swap' })];

  for (const face of faces) document.fonts.add(face);
  await Promise.all(faces.map((face) => face.load()));
}
