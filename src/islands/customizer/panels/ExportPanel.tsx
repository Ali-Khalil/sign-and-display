import { buttonClass, Section } from './ui';

interface Props {
  sizeText: string;
  letterText: string | null;
  estimate: number | null;
  waHref: string;
  watermarkAvailable: boolean;
  watermark: boolean;
  onWatermark(on: boolean): void;
  onPng(): void;
  onSvg(): void;
  onSave(): void;
  onLoad(file: File): void;
  onSend(): void;
}

export default function ExportPanel(p: Props) {
  return (
    <div class="grid gap-5">
      <Section title="Your sign">
        <dl class="grid gap-1 text-[0.95rem]">
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Sign area</dt>
            <dd class="font-semibold">{p.sizeText}</dd>
          </div>
          {p.letterText && (
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Letter height (approx.)</dt>
              <dd class="font-semibold">{p.letterText}</dd>
            </div>
          )}
          {p.estimate !== null && (
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Estimate</dt>
              <dd class="font-semibold">Estimated from Rs {p.estimate.toLocaleString('en-PK')}</dd>
            </div>
          )}
        </dl>
        {p.estimate !== null && <p class="text-sm text-muted">Final price confirmed on WhatsApp.</p>}
      </Section>

      <Section title="Send for a quote">
        <a
          href={p.waHref}
          target="_blank"
          rel="noopener"
          data-wa-location="customizer-export"
          data-wa-type="design"
          onClick={p.onSend}
          class="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-whatsapp px-6 font-semibold text-whatsapp-ink"
        >
          Send on WhatsApp
        </a>
        <p class="text-sm text-muted">
          This downloads a picture of your design, then opens WhatsApp with the details filled in. Please attach the
          downloaded image to your message.
        </p>
      </Section>

      <Section title="Download">
        <button type="button" class={buttonClass} onClick={p.onPng}>
          Download PNG image
        </button>
        {p.watermarkAvailable && (
          <label class="flex min-h-11 items-center gap-3 text-[0.95rem] font-semibold">
            <input type="checkbox" class="size-5 accent-ink" checked={p.watermark} onChange={(e) => p.onWatermark(e.currentTarget.checked)} />
            Add a small watermark
          </label>
        )}
        <button type="button" class={buttonClass} onClick={p.onSvg}>
          Download SVG (for designers)
        </button>
        <p class="text-sm text-muted">
          The SVG keeps the text as text. To open it correctly in CorelDRAW, the same fonts must be installed on that
          computer. Glow effects are not included.
        </p>
      </Section>

      <Section title="Design file">
        <div class="grid grid-cols-2 gap-2">
          <button type="button" class={buttonClass} onClick={p.onSave}>
            Save design
          </button>
          <label class={`${buttonClass} cursor-pointer`}>
            Load design
            <input
              type="file"
              accept="application/json,.json"
              class="sr-only"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) p.onLoad(file);
                e.currentTarget.value = '';
              }}
            />
          </label>
        </div>
        <p class="text-sm text-muted">A design file can be reopened here later, or sent to the workshop to open your exact design.</p>
      </Section>
    </div>
  );
}
