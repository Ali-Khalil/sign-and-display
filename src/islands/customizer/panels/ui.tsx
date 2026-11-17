import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';

export const inputClass = 'min-h-11 w-full min-w-0 rounded-lg border border-line bg-white px-3 text-base';
export const buttonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 text-[0.95rem] font-medium hover:bg-paper-soft disabled:opacity-40';

export function Section({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <fieldset class="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <legend class="float-start mb-3 w-full text-sm font-bold tracking-wide text-muted uppercase">{title}</legend>
      <div class="clear-both grid gap-4">{children}</div>
    </fieldset>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ComponentChildren }) {
  return (
    <label class="grid gap-1.5">
      <span class="text-[0.95rem] font-semibold">{label}</span>
      {children}
      {hint && <span class="text-sm text-muted">{hint}</span>}
    </label>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange(value: T): void;
}
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} class="grid gap-1.5">
      <span class="text-[0.95rem] font-semibold">{label}</span>
      <div class="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            class="min-h-11 flex-1 rounded-lg border border-line bg-white px-3 text-[0.95rem] font-medium whitespace-nowrap aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface SwatchesProps {
  label: string;
  value: string;
  colours: { name: string; value: string }[];
  onChange(value: string): void;
  /** Offer a free colour picker as well. */
  custom?: boolean;
}
export function Swatches({ label, value, colours, onChange, custom = true }: SwatchesProps) {
  return (
    <div role="group" aria-label={label} class="grid gap-1.5">
      <span class="text-[0.95rem] font-semibold">{label}</span>
      <div class="flex flex-wrap items-center gap-2">
        {colours.map((colour) => (
          <button
            type="button"
            title={colour.name}
            aria-label={colour.name}
            aria-pressed={value.toLowerCase() === colour.value.toLowerCase()}
            onClick={() => onChange(colour.value)}
            style={{ backgroundColor: colour.value }}
            class="size-11 rounded-full border border-black/25 aria-pressed:ring-2 aria-pressed:ring-ink aria-pressed:ring-offset-2"
          />
        ))}
        {custom && (
          <input
            type="color"
            aria-label={`${label}: custom colour`}
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'}
            onInput={(e) => onChange(e.currentTarget.value)}
            class="size-11 cursor-pointer rounded-lg border border-line bg-white p-1"
          />
        )}
      </div>
    </div>
  );
}

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  hint?: string;
  format?(value: number): string;
  onChange(value: number): void;
}
export function Range({ label, value, min, max, step = 1, disabled, hint, format, onChange }: RangeProps) {
  return (
    <label class="grid gap-1.5">
      <span class="flex justify-between text-[0.95rem] font-semibold">
        <span>{label}</span>
        <span class="font-normal text-muted">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onInput={(e) => onChange(Number(e.currentTarget.value))}
        class="h-11 w-full accent-ink disabled:opacity-40"
      />
      {hint && <span class="text-sm text-muted">{hint}</span>}
    </label>
  );
}

interface NumberInputProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onCommit(value: number): void;
}
/**
 * Number box that keeps what is being typed in its own state and commits on
 * blur or Enter, so a re-render of the designer never wipes a half-typed
 * value. While nothing is being typed it simply shows the committed value.
 */
export function NumberInput({ label, unit, value, min, max, step = 1, onCommit }: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const parsed = Number(draft);
    setDraft(null);
    if (draft.trim() === '' || !Number.isFinite(parsed)) return;
    const next = Math.min(max, Math.max(min, parsed));
    if (next !== value) onCommit(next);
  };

  return (
    <label class="relative">
      <span class="sr-only">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft ?? String(value)}
        class={inputClass}
        onInput={(e) => setDraft(e.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
      <span class="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted">{unit}</span>
    </label>
  );
}
