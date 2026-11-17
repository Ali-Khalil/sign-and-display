import { useEffect, useState } from 'preact/hooks';
import { signFonts, type SignFont } from '../../../config/fonts';
import type { Mode } from '../lib/design';
import { isFontReady, loadSignFont } from '../lib/fonts';
import { hasArabicScript } from '../lib/rtl';

interface Props {
  value: string;
  text: string;
  mode: Mode;
  onChange(family: string): void;
}

/** Fonts in the order that suits the text and mode: Urdu first for Urdu text, neon styles first in neon mode. */
function ordered(urdu: boolean, mode: Mode): SignFont[] {
  const rank = (font: SignFont) => {
    if (font.rtl) return urdu ? 0 : 9;
    if (mode === 'neon') return font.category === 'neon' ? 1 : font.category === 'script' ? 2 : 3;
    return font.category === 'bold' ? 1 : 2;
  };
  return [...signFonts].sort((a, b) => rank(a) - rank(b));
}

export default function FontPicker({ value, text, mode, onChange }: Props) {
  const urdu = hasArabicScript(text);
  const sample = (text.split('\n')[0] ?? '').trim().slice(0, urdu ? 14 : 22) || (urdu ? 'اردو' : 'Sample');
  const [, setTick] = useState(0);

  // Latin fonts are small and load when the picker opens. The large Nastaliq
  // fonts load only when the text is Urdu or one of them is chosen.
  useEffect(() => {
    let alive = true;
    for (const font of signFonts) {
      if (font.rtl && !urdu && font.family !== value) continue;
      void loadSignFont(font.family, sample).then(() => alive && setTick((t) => t + 1));
    }
    return () => {
      alive = false;
    };
  }, [urdu, sample, value]);

  return (
    <div role="radiogroup" aria-label="Font" class="grid gap-1.5">
      <span class="text-[0.95rem] font-semibold">Font</span>
      <div class="max-h-80 overflow-y-auto rounded-lg border border-line bg-paper-soft p-2">
        <div class="grid grid-cols-2 gap-2">
        {ordered(urdu, mode).map((font) => {
          const ready = isFontReady(font.family);
          // Urdu text is previewed in Urdu fonts; other fonts show their own name.
          const preview = font.rtl || !urdu ? sample : font.family;
          const tall = ready && font.rtl;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={value === font.family}
              aria-label={font.family}
              onClick={() => onChange(font.family)}
              class="grid min-w-0 content-center justify-items-center gap-0.5 overflow-hidden rounded-lg border border-line bg-white px-2 py-1.5 aria-checked:border-ink aria-checked:ring-2 aria-checked:ring-ink"
            >
              <span
                dir="auto"
                class={`block max-w-full text-xl whitespace-nowrap ${tall ? 'h-14 leading-[3.5rem]' : 'h-9 truncate leading-9'}`}
                style={{ fontFamily: ready ? `"${font.family}", sans-serif` : undefined }}
              >
                {ready ? preview : font.family}
              </span>
              <span class="max-w-full truncate text-xs text-muted">{font.family}</span>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
