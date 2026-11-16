import type { Design, ImageLayer, Layer, TextLayer } from '../lib/design';
import { FACE_COLOURS, NEON_COLOURS } from '../lib/design';
import { hasArabicScript } from '../lib/rtl';
import FontPicker from './FontPicker';
import { buttonClass, Range, Section, Segmented, Swatches } from './ui';

interface Props {
  design: Design;
  layer: Layer | undefined;
  onChange(id: string, patch: Partial<TextLayer> | Partial<ImageLayer>): void;
  onDesign(patch: Partial<Design>): void;
  onOrder(id: string, direction: 1 | -1): void;
  onDuplicate(id: string): void;
  onCentre(id: string): void;
}

const GLOW_COLOURS = [{ name: 'Warm white', value: '#ffd76a' }, ...NEON_COLOURS.slice(1)];

export default function StylePanel({ design, layer, onChange, onDesign, onOrder, onDuplicate, onCentre }: Props) {
  const { mode } = design;

  const lighting = (mode === 'led' || mode === 'neon') && (
    <Section title="Lighting">
      {mode === 'led' && (
        <Segmented
          label="Lighting style"
          value={design.lighting}
          options={[
            { value: 'front-lit', label: 'Front-lit' },
            { value: 'halo', label: 'Halo-lit' },
          ]}
          onChange={(value) => onDesign({ lighting: value })}
        />
      )}
      <Segmented
        label="Lights"
        value={design.lit ? 'on' : 'off'}
        options={[
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
        ]}
        onChange={(value) => onDesign({ lit: value === 'on' })}
      />
      {mode === 'neon' && (
        <label class="flex min-h-11 items-center gap-3 text-[0.95rem] font-semibold">
          <input type="checkbox" class="size-5 accent-ink" checked={design.flicker} onChange={(e) => onDesign({ flicker: e.currentTarget.checked })} />
          Subtle flicker
        </label>
      )}
    </Section>
  );

  if (!layer) {
    return (
      <div class="grid gap-5">
        {lighting}
        <p class="text-muted">Add some text first, then style it here.</p>
      </div>
    );
  }

  const arrange = (
    <Section title="Arrange">
      <div class="grid grid-cols-2 gap-2">
        <button type="button" class={buttonClass} onClick={() => onCentre(layer.id)}>
          Centre on sign
        </button>
        <button type="button" class={buttonClass} onClick={() => onDuplicate(layer.id)}>
          Duplicate
        </button>
        <button type="button" class={buttonClass} onClick={() => onOrder(layer.id, 1)}>
          Bring forward
        </button>
        <button type="button" class={buttonClass} onClick={() => onOrder(layer.id, -1)}>
          Send back
        </button>
      </div>
      <Range label="Rotate" value={Math.round(layer.angle)} min={-180} max={180} format={(v) => `${v}°`} onChange={(angle) => onChange(layer.id, { angle })} />
    </Section>
  );

  if (layer.type === 'image') {
    return (
      <div class="grid gap-5">
        <Section title={layer.name}>
          <Range
            label="Size"
            value={Math.round(layer.scale * 100)}
            min={5}
            max={300}
            format={(v) => `${v}%`}
            onChange={(v) => onChange(layer.id, { scale: v / 100 })}
          />
        </Section>
        {arrange}
        {lighting}
      </div>
    );
  }

  const urdu = hasArabicScript(layer.text);
  const set = (patch: Partial<TextLayer>) => onChange(layer.id, patch);

  return (
    <div class="grid gap-5">
      <Section title="Lettering">
        <FontPicker value={layer.fontFamily} text={layer.text} mode={mode} onChange={(fontFamily) => set({ fontFamily })} />
        <Range label="Size" value={Math.round(layer.fontSize)} min={12} max={420} onChange={(fontSize) => set({ fontSize })} />
        {mode === 'neon' ? (
          <Swatches label="Neon colour" value={layer.glow} colours={NEON_COLOURS} custom={false} onChange={(glow) => set({ glow })} />
        ) : (
          <Swatches label={mode === 'led' ? 'Letter face colour' : 'Colour'} value={layer.color} colours={FACE_COLOURS} onChange={(color) => set({ color })} />
        )}
        {mode === 'led' && <Swatches label="Light colour" value={layer.glow} colours={GLOW_COLOURS} custom={false} onChange={(glow) => set({ glow })} />}
        <Segmented
          label="Alignment"
          value={layer.align}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Centre' },
            { value: 'right', label: 'Right' },
          ]}
          onChange={(align) => set({ align })}
        />
      </Section>

      <Section title="Spacing">
        <Range
          label="Letter spacing"
          value={urdu ? 0 : layer.charSpacing}
          min={-50}
          max={400}
          step={10}
          disabled={urdu}
          hint={urdu ? 'Off for Urdu: spacing would break the joined letters.' : undefined}
          onChange={(charSpacing) => set({ charSpacing })}
        />
        <Range label="Line height" value={layer.lineHeight} min={0.8} max={3} step={0.05} format={(v) => v.toFixed(2)} onChange={(lineHeight) => set({ lineHeight })} />
      </Section>

      {mode !== 'neon' && (
        <Section title="Outline">
          <Range label="Outline width" value={Math.round(layer.outlineWidth)} min={0} max={24} onChange={(outlineWidth) => set({ outlineWidth })} />
          {layer.outlineWidth > 0 && <Swatches label="Outline colour" value={layer.outlineColor} colours={FACE_COLOURS} onChange={(outlineColor) => set({ outlineColor })} />}
        </Section>
      )}

      {lighting}
      {arrange}
    </div>
  );
}
