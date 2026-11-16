/**
 * Fonts offered in the sign customizer. All are self-hosted WOFF2 under
 * /public/fonts and licensed under the SIL Open Font License (licence texts
 * in /public/fonts/licenses).
 *
 * Phase 0 ships only the fonts the RTL spike needs; the full curated list
 * (10–14 fonts) is added in Phase 2.
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

export const signFonts: SignFont[] = [
  {
    family: 'Noto Nastaliq Urdu',
    file: 'noto-nastaliq-urdu-arabic-400-normal.woff2',
    latinFile: 'noto-nastaliq-urdu-latin-400-normal.woff2',
    category: 'urdu',
    rtl: true,
  },
  {
    family: 'Gulzar',
    file: 'gulzar-arabic-400-normal.woff2',
    latinFile: 'gulzar-latin-400-normal.woff2',
    category: 'urdu',
    rtl: true,
  },
  {
    family: 'Lalezar',
    file: 'lalezar-arabic-400-normal.woff2',
    latinFile: 'lalezar-latin-400-normal.woff2',
    category: 'urdu',
    rtl: true,
  },
  { family: 'Anton', file: 'anton-latin-400-normal.woff2', category: 'bold', rtl: false },
  { family: 'Tilt Neon', file: 'tilt-neon-latin-400-normal.woff2', category: 'neon', rtl: false },
];
