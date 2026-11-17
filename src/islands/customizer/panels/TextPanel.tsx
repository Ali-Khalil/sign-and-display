import type { Design } from '../lib/design';
import { MAX_LAYERS } from '../lib/design';
import { buttonClass } from './ui';

interface Props {
  design: Design;
  selectedId: string | null;
  onSelect(id: string): void;
  onText(id: string, text: string): void;
  onAddText(): void;
  onAddLogo(file: File): void;
  onRemove(id: string): void;
}

/**
 * Text is typed here, in plain textareas with dir="auto", never on the
 * canvas: on-canvas editing is unreliable for Urdu.
 */
export default function TextPanel({ design, selectedId, onSelect, onText, onAddText, onAddLogo, onRemove }: Props) {
  const full = design.layers.length >= MAX_LAYERS;
  let textCount = 0;

  return (
    <div class="grid gap-4">
      <ul class="grid gap-3">
        {design.layers.map((layer) => {
          const selected = layer.id === selectedId;
          if (layer.type === 'image') {
            return (
              <li class={`flex items-center gap-3 rounded-lg border p-2 ${selected ? 'border-ink' : 'border-line'}`}>
                <img src={layer.src} alt="" class="size-11 rounded bg-paper-soft object-contain" />
                <button type="button" class="min-h-11 flex-1 truncate text-start font-medium" onClick={() => onSelect(layer.id)}>
                  {layer.name}
                </button>
                <button type="button" class={buttonClass} aria-label={`Remove ${layer.name}`} onClick={() => onRemove(layer.id)}>
                  Remove
                </button>
              </li>
            );
          }
          textCount += 1;
          const label = `Text ${textCount}`;
          return (
            <li class={`rounded-lg border p-2 ${selected ? 'border-ink' : 'border-line'}`}>
              <div class="flex items-center justify-between gap-2">
                <label for={`text-${layer.id}`} class="text-[0.95rem] font-semibold">
                  {label}
                </label>
                <button type="button" class="min-h-11 px-2 text-sm font-medium text-muted underline" aria-label={`Remove ${label}`} onClick={() => onRemove(layer.id)}>
                  Remove
                </button>
              </div>
              <textarea
                id={`text-${layer.id}`}
                dir="auto"
                rows={Math.min(4, Math.max(2, layer.text.split('\n').length))}
                value={layer.text}
                placeholder="Type English or اردو"
                onFocus={() => onSelect(layer.id)}
                onInput={(e) => onText(layer.id, e.currentTarget.value)}
                class="w-full rounded-lg border border-line bg-white px-3 py-2 text-lg"
              />
            </li>
          );
        })}
      </ul>

      <div class="grid grid-cols-2 gap-2">
        <button type="button" class={buttonClass} disabled={full} onClick={onAddText}>
          + Add text
        </button>
        <label class={`${buttonClass} cursor-pointer ${full ? 'pointer-events-none opacity-40' : ''}`}>
          + Add logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            class="sr-only"
            disabled={full}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) onAddLogo(file);
              e.currentTarget.value = '';
            }}
          />
        </label>
      </div>
      <p class="text-sm text-muted">Logos stay on your device. Type Urdu with your phone's Urdu keyboard.</p>
    </div>
  );
}
