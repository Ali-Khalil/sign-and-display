/**
 * Fonts offered in the sign customizer: a curated list of 14, all
 * self-hosted WOFF2 under /public/fonts and all under the SIL Open Font
 * License (licence texts in /public/fonts/licenses).
 *
 * Do not add Jameel Noori Nastaleeq, Alvi Nastaleeq, Faiz Lahori or any
 * Windows/Corel font without written permission for web embedding.
 */
export type FontCategory = 'neon' | 'bold' | 'script' | 'urdu';

export interface SignFont {
  family: string;
  /** Main WOFF2 file, relative to /fonts/. For Urdu fonts: the Arabic subset. */
  file: string;
  /** Latin subset (digits, English) for fonts that are split by script. */
  latinFile?: string;
  category: FontCategory;
  rtl: boolean;
}

/** Unicode ranges of the two subsets, as published by Google Fonts. */
export const ARABIC_RANGE =
  'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
export const LATIN_RANGE =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const latin = (family: string, slug: string, category: FontCategory, weight = 400): SignFont => ({
  family,
  file: `${slug}-latin-${weight}-normal.woff2`,
  category,
  rtl: false,
});
const urdu = (family: string, slug: string): SignFont => ({
  family,
  file: `${slug}-arabic-400-normal.woff2`,
  latinFile: `${slug}-latin-400-normal.woff2`,
  category: 'urdu',
  rtl: true,
});

export const signFonts: SignFont[] = [
  // Bold / display
  latin('Montserrat Black', 'montserrat', 'bold', 900), // close to "SIGN" in the logo
  latin('Anton', 'anton', 'bold'),
  latin('Archivo Black', 'archivo-black', 'bold'),
  latin('Bebas Neue', 'bebas-neue', 'bold'),
  latin('Oswald', 'oswald', 'bold', 700),
  latin('Alfa Slab One', 'alfa-slab-one', 'bold'),
  // Neon
  latin('Tilt Neon', 'tilt-neon', 'neon'),
  latin('Neonderthaw', 'neonderthaw', 'neon'),
  latin('Monoton', 'monoton', 'neon'),
  // Script
  latin('Pacifico', 'pacifico', 'script'),
  latin('Sacramento', 'sacramento', 'script'),
  // Urdu
  urdu('Noto Nastaliq Urdu', 'noto-nastaliq-urdu'),
  urdu('Gulzar', 'gulzar'),
  urdu('Lalezar', 'lalezar'),
];

export const DEFAULT_URDU_FONT = 'Noto Nastaliq Urdu';
export const DEFAULT_FONT = 'Montserrat Black';
export const DEFAULT_NEON_FONT = 'Tilt Neon';

export function getFont(family: string): SignFont | undefined {
  return signFonts.find((f) => f.family === family);
}
