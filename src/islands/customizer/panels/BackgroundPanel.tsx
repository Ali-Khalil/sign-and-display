import type { Background, Design } from '../lib/design';
import { BACKGROUNDS } from '../lib/design';
import { buttonClass, Section, Segmented } from './ui';

interface Props {
  design: Design;
  onBackground(background: Background): void;
  onUpload(file: File): void;
  onNight(night: boolean): void;
}

export default function BackgroundPanel({ design, onBackground, onUpload, onNight }: Props) {
  const bg = design.background;
  return (
    <div class="grid gap-5">
      <Section title="Time of day">
        <Segmented
          label="Show the sign by"
          value={design.night ? 'night' : 'day'}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'night', label: 'Night' },
          ]}
          onChange={(value) => onNight(value === 'night')}
        />
      </Section>

      <Section title="Wall">
        <div role="radiogroup" aria-label="Background scene" class="grid grid-cols-3 gap-2">
          {BACKGROUNDS.map((scene) => (
            <button
              type="button"
              role="radio"
              aria-checked={bg.kind === 'preset' && bg.id === scene.id}
              onClick={() => onBackground({ kind: 'preset', id: scene.id })}
              class="overflow-hidden rounded-lg border border-line bg-white text-xs font-medium aria-checked:border-ink aria-checked:ring-2 aria-checked:ring-ink"
            >
              <img src={`/customizer/backgrounds/${scene.id}-thumb.webp`} alt="" width={240} height={180} loading="lazy" class="aspect-[4/3] w-full object-cover" />
              <span class="block px-1 py-1.5">{scene.label}</span>
            </button>
          ))}
        </div>
        <label class={`${buttonClass} cursor-pointer`}>
          {bg.kind === 'upload' ? 'Change your shopfront photo' : 'Upload your shopfront photo'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="sr-only"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) onUpload(file);
              e.currentTarget.value = '';
            }}
          />
        </label>
        <p class="text-sm text-muted">
          Your photo stays on this device. It is only shared if you send the finished design yourself.
        </p>
      </Section>
    </div>
  );
}
