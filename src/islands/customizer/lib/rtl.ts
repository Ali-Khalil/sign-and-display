/** Arabic-script detection (Arabic, Arabic Supplement, Presentation Forms A/B). */
const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

export function hasArabicScript(text: string): boolean {
  return ARABIC_SCRIPT.test(text);
}

/** Direction used for a sign text layer: RTL whenever Urdu/Arabic is present. */
export function textDirection(text: string): 'rtl' | 'ltr' {
  return hasArabicScript(text) ? 'rtl' : 'ltr';
}

/**
 * Keeps phone numbers readable inside RTL text.
 *
 * In a right-to-left paragraph the Unicode bidi algorithm treats the parts of
 * "0300-1234567" as separate numbers and lays them out right to left, so the
 * sign would read "1234567-0300". Wrapping each number run in a
 * left-to-right isolate (U+2066 … U+2069) keeps it in typed order. The marks
 * are invisible and are only added at draw time, never to the stored text.
 */
const NUMBER_RUN = /[+(]?\d[\d\s\-–.()/]*\d\)?/g;

export function isolateNumbers(text: string): string {
  return text.replace(NUMBER_RUN, (run) => `⁦${run}⁩`);
}
