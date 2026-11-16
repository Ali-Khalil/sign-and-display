import type { Board, Design } from '../lib/design';
import { BOARD_COLOURS } from '../lib/design';
import { formatSize, fromFeetInches, toFeetInches } from '../lib/units';
import { NumberInput, Section, Segmented, Swatches } from './ui';

interface Props {
  design: Design;
  onBoard(patch: Partial<Board>): void;
  /** Only the side that changed is passed, so the other always comes from the latest design. */
  onResize(size: { widthIn?: number; heightIn?: number }): void;
}

const clamp = (inches: number) => Math.min(600, Math.max(4, inches));

export default function BoardPanel({ design, onBoard, onResize }: Props) {
  const { board, mode } = design;
  const w = toFeetInches(board.widthIn);
  const h = toFeetInches(board.heightIn);

  const dimension = (label: string, value: { feet: number; inches: number }, apply: (inches: number) => void) => (
    <div class="grid gap-1.5">
      <span class="text-[0.95rem] font-semibold">{label}</span>
      <div class="grid grid-cols-2 gap-2">
        <NumberInput label={`${label} feet`} unit="ft" value={value.feet} min={0} max={50} onCommit={(feet) => apply(clamp(fromFeetInches(feet, value.inches)))} />
        <NumberInput label={`${label} inches`} unit="in" value={value.inches} min={0} max={11.5} step={0.5} onCommit={(inches) => apply(clamp(fromFeetInches(value.feet, inches)))} />
      </div>
    </div>
  );

  const styles: { value: Board['style']; label: string }[] =
    mode === 'neon'
      ? [
          { value: 'clear', label: 'Clear acrylic' },
          { value: 'solid', label: 'Coloured' },
          { value: 'none', label: 'None' },
        ]
      : [
          { value: 'none', label: 'On the wall' },
          { value: 'solid', label: 'On a board' },
        ];
  const shapes: { value: Board['shape']; label: string }[] = [
    { value: 'rect', label: 'Rectangle' },
    { value: 'rounded', label: 'Rounded' },
    ...(mode === 'neon' ? [{ value: 'cut' as const, label: 'Cut to shape' }] : [{ value: 'pill' as const, label: 'Pill' }]),
  ];

  return (
    <div class="grid gap-5">
      <Section title="Real size">
        {dimension('Width', w, (widthIn) => onResize({ widthIn }))}
        {dimension('Height', h, (heightIn) => onResize({ heightIn }))}
        <p class="text-sm text-muted" aria-live="polite">
          Sign area: <strong class="text-ink">{formatSize(board.widthIn, board.heightIn)}</strong>
          {board.style === 'none' && ' (the dashed outline on the preview)'}
        </p>
      </Section>

      <Section title={mode === 'neon' ? 'Backing' : 'Board'}>
        {mode !== 'flat-board' && <Segmented label={mode === 'neon' ? 'Acrylic backing' : 'Letters fixed'} value={board.style} options={styles} onChange={(style) => onBoard({ style })} />}
        {board.style !== 'none' && <Segmented label="Shape" value={board.shape} options={shapes} onChange={(shape) => onBoard({ shape })} />}
        {board.shape === 'cut' && board.style !== 'none' && (
          <p class="text-sm text-muted">Shown as a rounded outline around the lettering. The real backing is cut closer to the letters.</p>
        )}
        {board.style === 'solid' && (
          <>
            <Swatches label={mode === 'neon' ? 'Backing colour' : 'Board colour'} value={board.color} colours={BOARD_COLOURS} onChange={(color) => onBoard({ color })} />
            <Segmented
              label="Finish"
              value={board.finish}
              options={[
                { value: 'matte', label: 'Matte' },
                { value: 'gloss', label: 'Gloss' },
                { value: 'glitter', label: 'Glitter' },
              ]}
              onChange={(finish) => onBoard({ finish })}
            />
            {mode !== 'neon' && (
              <label class="flex min-h-11 items-center gap-3 text-[0.95rem] font-semibold">
                <input type="checkbox" class="size-5 accent-ink" checked={board.border} onChange={(e) => onBoard({ border: e.currentTarget.checked })} />
                Aluminium border
              </label>
            )}
          </>
        )}
      </Section>
    </div>
  );
}
