import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { isPlaceholder, site } from '../../config/site';
import { track } from '../../lib/analytics';
import { waLink, waMessageForDesign } from '../../lib/whatsapp';
import { Scene } from './canvas/scene';
import {
  applyMode,
  BOARD_COLOURS,
  defaultDesign,
  FACE_COLOURS,
  makeText,
  MAX_LAYERS,
  MODES,
  NEON_COLOURS,
  newId,
  parseDesign,
  resizeBoard,
  urduAdjust,
  type Design,
  type ImageLayer,
  type Layer,
  type Mode,
  type TextLayer,
} from './lib/design';
import { downloadDataUrl, downloadText, readImage } from './lib/export';
import { History } from './lib/history';
import { estimatePrice } from './lib/pricing';
import { hasArabicScript } from './lib/rtl';
import { clearDesign, loadDesign, saveDesign } from './lib/storage';
import { boardRect, formatInches, formatSize } from './lib/units';
import BackgroundPanel from './panels/BackgroundPanel';
import BoardPanel from './panels/BoardPanel';
import ExportPanel from './panels/ExportPanel';
import StylePanel from './panels/StylePanel';
import TextPanel from './panels/TextPanel';
import { TEMPLATES } from './templates';

type Tab = 'text' | 'style' | 'board' | 'background' | 'export';
const TABS: { id: Tab; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'style', label: 'Style' },
  { id: 'board', label: 'Board' },
  { id: 'background', label: 'Background' },
  { id: 'export', label: 'Export' },
];

const WA_ICON =
  'M12 2a10 10 0 0 0-8.66 15l-1.3 4.74a.4.4 0 0 0 .5.5l4.86-1.28A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.16 15.27l-.3-.18-3.1.82.83-3.02-.2-.31A8.2 8.2 0 0 1 12 3.8Zm-3.3 3.9c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.22 3.08.15.2 2.07 3.3 5.1 4.5 2.52.99 3.03.8 3.58.74.55-.05 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35l-2.02-1c-.3-.1-.5-.15-.7.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48a9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52l-.92-2.22c-.24-.58-.49-.5-.67-.5Z';

function initialDesign(): Design {
  const param = new URLSearchParams(location.search).get('mode');
  const mode = MODES.find((m) => m.id === param)?.id;
  const saved = loadDesign();
  if (saved) return mode ? applyMode(saved, mode) : saved;
  return defaultDesign(mode ?? 'flat-board');
}

const colourName = (value: string, list: { name: string; value: string }[]) =>
  list.find((c) => c.value.toLowerCase() === value.toLowerCase())?.name ?? value;

const toolClass =
  'inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-line bg-white px-3 text-[0.95rem] font-medium whitespace-nowrap hover:bg-paper-soft disabled:opacity-40 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white';

export default function Customizer() {
  const [design, setDesign] = useState<Design>(initialDesign);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('text');
  const [letterIn, setLetterIn] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [watermark, setWatermark] = useState(false);
  const [, bump] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const templatesRef = useRef<HTMLDialogElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const designRef = useRef(design);
  const historyRef = useRef(new History<Design>(50));
  const burstRef = useRef<{ start: Design; timer: number } | null>(null);

  // ----- state + undo/redo -------------------------------------------------
  const apply = useCallback((next: Design) => {
    designRef.current = next;
    setDesign(next);
  }, []);

  /** Close the current burst of edits into one undo step. */
  const flush = useCallback(() => {
    const burst = burstRef.current;
    if (!burst) return;
    window.clearTimeout(burst.timer);
    historyRef.current.record(burst.start);
    burstRef.current = null;
    bump((n) => n + 1);
  }, []);

  /** Change the design. Rapid changes (typing, dragging a slider) share one undo step. */
  const update = useCallback(
    (fn: (design: Design) => Design) => {
      const previous = designRef.current;
      const next = fn(previous);
      if (next === previous) return;
      if (burstRef.current) window.clearTimeout(burstRef.current.timer);
      else burstRef.current = { start: previous, timer: 0 };
      burstRef.current.timer = window.setTimeout(flush, 500);
      apply(next);
    },
    [apply, flush],
  );

  const undo = useCallback(() => {
    flush();
    const previous = historyRef.current.undo(designRef.current);
    if (previous) apply(previous);
    bump((n) => n + 1);
  }, [apply, flush]);

  const redo = useCallback(() => {
    flush();
    const next = historyRef.current.redo(designRef.current);
    if (next) apply(next);
    bump((n) => n + 1);
  }, [apply, flush]);

  const updateLayer = useCallback(
    (id: string, patch: Partial<TextLayer> | Partial<ImageLayer>) =>
      update((d) => ({ ...d, layers: d.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)) })),
    [update],
  );

  // ----- canvas ------------------------------------------------------------
  useEffect(() => {
    const scene = new Scene(canvasRef.current!, {
      onSelect: (id) => setSelectedId(id),
      onTransform: (id, patch) => updateLayer(id, patch),
      onEditRequest: (id) => {
        setSelectedId(id);
        setTab('text');
        requestAnimationFrame(() => document.getElementById(`text-${id}`)?.focus());
      },
    });
    sceneRef.current = scene;
    const wrap = wrapRef.current!;
    const fit = () => scene.resize(Math.max(200, Math.floor(wrap.clientWidth)));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wrap);
    scene.render(designRef.current);
    track('customizer_open', { mode: designRef.current.mode });
    (window as unknown as Record<string, unknown>).__signDesigner = { getDesign: () => designRef.current, scene };
    return () => {
      observer.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, [updateLayer]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.render(design);
    const save = window.setTimeout(() => saveDesign(design), 400);
    // Letter height depends on the font, which may still be loading.
    const measure = () => setLetterIn(scene.letterHeightIn(selectedId));
    measure();
    const later = window.setTimeout(measure, 600);
    return () => {
      window.clearTimeout(save);
      window.clearTimeout(later);
    };
  }, [design, selectedId]);

  useEffect(() => {
    sceneRef.current?.select(selectedId);
  }, [selectedId, design.layers.length]);

  // ----- actions -----------------------------------------------------------
  const setMode = (mode: Mode) => {
    if (mode === design.mode) return;
    update((d) => applyMode(d, mode));
    track('customizer_mode', { mode });
    const url = new URL(location.href);
    url.searchParams.set('mode', mode);
    history.replaceState(null, '', url);
  };

  const setText = (id: string, text: string) =>
    update((d) => ({
      ...d,
      layers: d.layers.map((l) => {
        if (l.id !== id || l.type !== 'text') return l;
        const next = { ...l, text };
        // The first Urdu character switches the layer to an Urdu font and safe spacing.
        return !hasArabicScript(l.text) && hasArabicScript(text) ? urduAdjust(next) : next;
      }),
    }));

  const addText = () => {
    if (design.layers.length >= MAX_LAYERS) return;
    const rect = boardRect(design.board);
    const layer = makeText(design, 'New text', { fontSize: Math.round(rect.height * 0.16), y: rect.cy + rect.height * 0.3 });
    update((d) => ({ ...d, layers: [...d.layers, layer] }));
    setSelectedId(layer.id);
    requestAnimationFrame(() => {
      const input = document.getElementById(`text-${layer.id}`) as HTMLTextAreaElement | null;
      input?.focus();
      input?.select();
    });
  };

  const addLogo = async (file: File) => {
    try {
      const image = await readImage(file, 1000, true);
      const rect = boardRect(designRef.current.board);
      const layer: ImageLayer = {
        id: newId(),
        type: 'image',
        src: image.src,
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'Logo',
        x: rect.cx,
        y: rect.cy,
        scale: Math.min(1, (rect.height * 0.5) / image.height, (rect.width * 0.4) / image.width),
        angle: 0,
      };
      update((d) => ({ ...d, layers: [...d.layers, layer] }));
      setSelectedId(layer.id);
      setNotice('Logo added.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'That image could not be read.');
    }
  };

  const uploadBackground = async (file: File) => {
    try {
      const image = await readImage(file, 2000, false);
      update((d) => ({ ...d, background: { kind: 'upload', src: image.src } }));
      setNotice('Photo added as the background.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'That photo could not be read.');
    }
  };

  const removeLayer = (id: string) => {
    update((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateLayer = (id: string) => {
    const source = design.layers.find((l) => l.id === id);
    if (!source || design.layers.length >= MAX_LAYERS) return;
    const copy = { ...source, id: newId(), x: source.x + 30, y: source.y + 30 };
    update((d) => ({ ...d, layers: [...d.layers, copy] }));
    setSelectedId(copy.id);
  };

  const orderLayer = (id: string, direction: 1 | -1) =>
    update((d) => {
      const from = d.layers.findIndex((l) => l.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= d.layers.length) return d;
      const layers = [...d.layers];
      [layers[from], layers[to]] = [layers[to]!, layers[from]!];
      return { ...d, layers };
    });

  const centreLayer = (id: string) => {
    const rect = boardRect(design.board);
    updateLayer(id, { x: rect.cx, y: rect.cy });
  };

  const startOver = () => {
    if (!window.confirm('Start over? Your current design will be cleared.')) return;
    clearDesign();
    update((d) => defaultDesign(d.mode));
    setSelectedId(null);
    setTab('text');
  };

  const useTemplate = (id: string) => {
    const template = TEMPLATES.find((t) => t.id === id);
    if (!template) return;
    update(() => template.build());
    setSelectedId(null);
    templatesRef.current?.close();
  };

  // ----- summary, export, send ---------------------------------------------
  const textLayers = design.layers.filter((l): l is TextLayer => l.type === 'text');
  const activeLayer = design.layers.find((l) => l.id === selectedId) ?? textLayers[0];
  const sizeText = formatSize(design.board.widthIn, design.board.heightIn);
  const letterText = letterIn && textLayers.length ? formatInches(letterIn) : null;
  const estimate = estimatePrice(design, letterIn);
  const modeLabel = MODES.find((m) => m.id === design.mode)!.label;
  const watermarkText = isPlaceholder(site.name) ? '' : site.name;

  const lightingText =
    design.mode === 'neon' ? 'LED neon' : design.mode === 'led' ? (design.lighting === 'halo' ? 'Halo-lit' : 'Front-lit') : 'Non-lit';
  const coloursText = [
    ...new Set(
      textLayers.map((l) =>
        design.mode === 'neon'
          ? colourName(l.glow, NEON_COLOURS)
          : design.mode === 'led'
            ? `${colourName(l.color, FACE_COLOURS)} face, ${colourName(l.glow, NEON_COLOURS)} light`
            : colourName(l.color, FACE_COLOURS),
      ),
    ),
    design.board.style === 'solid' ? `${colourName(design.board.color, BOARD_COLOURS)} board` : design.board.style === 'clear' ? 'clear acrylic backing' : '',
  ]
    .filter(Boolean)
    .join(', ');

  const waHref = waLink(
    waMessageForDesign({
      mode: modeLabel,
      text: textLayers.map((l) => l.text.replace(/\n/g, ' ')).join(' / ') || '(no text)',
      font: [...new Set(textLayers.map((l) => l.fontFamily))].join(', '),
      colours: coloursText,
      size: letterText ? `${sizeText} (letters approx. ${letterText})` : sizeText,
      lighting: lightingText,
      estimate: estimate !== null ? `from Rs ${estimate.toLocaleString('en-PK')}` : undefined,
      pageUrl: `${location.origin}${location.pathname}`,
    }),
  );

  const downloadPng = (): boolean => {
    const scene = sceneRef.current;
    if (!scene) return false;
    downloadDataUrl(scene.toPNG(2400, watermark ? watermarkText : ''), 'sign-design.png');
    return true;
  };
  const exportPng = () => {
    if (downloadPng()) track('customizer_export_png', { mode: design.mode });
  };
  const exportSvg = () => {
    const scene = sceneRef.current;
    if (scene) downloadText(scene.toSVG(), 'sign-design.svg', 'image/svg+xml');
  };
  const saveFile = () => downloadText(JSON.stringify(design, null, 2), 'sign-design.json', 'application/json');
  const loadFile = async (file: File) => {
    try {
      const loaded = parseDesign(JSON.parse(await file.text()));
      if (!loaded) throw new Error('bad file');
      update(() => loaded);
      setSelectedId(null);
      setNotice('Design loaded.');
    } catch {
      setNotice('That file is not a sign design saved from this page.');
    }
  };
  /** Runs on the WhatsApp link's click: the image downloads, then the link opens WhatsApp. */
  const onSend = () => {
    downloadPng();
    track('customizer_send_whatsapp', { mode: design.mode });
  };

  // ----- keyboard ----------------------------------------------------------
  const onKeyDown = (event: KeyboardEvent) => {
    const el = event.target as HTMLElement;
    const typing = el.matches('input, textarea, select');
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === 'z' && !typing) {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && event.key.toLowerCase() === 'y' && !typing) {
      event.preventDefault();
      redo();
      return;
    }
    if (typing || !selectedId || !wrapRef.current?.contains(el)) return;
    const layer = design.layers.find((l) => l.id === selectedId);
    if (!layer) return;
    const step = event.shiftKey ? 20 : 4;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      updateLayer(layer.id, { x: layer.x + move[0], y: layer.y + move[1] });
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeLayer(layer.id);
    }
  };

  const canUndo = historyRef.current.canUndo || burstRef.current !== null;
  const canRedo = historyRef.current.canRedo && burstRef.current === null;
  const hasLights = design.mode === 'led' || design.mode === 'neon';

  return (
    <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3" onKeyDown={onKeyDown} data-sign-designer={design.mode}>
      <div role="group" aria-label="Sign type" class="grid grid-cols-4 gap-1">
        {MODES.map((m) => (
          <button
            type="button"
            title={m.hint}
            aria-pressed={design.mode === m.id}
            onClick={() => setMode(m.id)}
            class="min-h-11 min-w-0 rounded-lg border border-line bg-white px-1 text-sm font-semibold hover:bg-paper-soft aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white sm:text-[0.95rem]"
          >
            {m.label}
          </button>
        ))}
      </div>

      <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div class="sticky top-0 z-20 -mx-4 grid grid-cols-[minmax(0,1fr)] gap-2 bg-white px-4 pb-2 sm:mx-0 sm:px-0 lg:top-4">
          <div
            ref={wrapRef}
            tabIndex={0}
            role="group"
            aria-label="Sign preview. Drag to move a layer. With a layer selected, arrow keys move it and Delete removes it."
            class="aspect-[4/3] w-full overflow-hidden rounded-xl bg-ink-soft"
          >
            <canvas ref={canvasRef} />
          </div>

          <div class="flex items-center gap-2">
            <div class="flex min-w-0 flex-1 gap-2 overflow-x-auto" role="toolbar" aria-label="Design tools">
              <button type="button" class={toolClass} disabled={!canUndo} onClick={undo} aria-label="Undo" title="Undo">
                <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M9 14 4 9l5-5" />
                  <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
                </svg>
              </button>
              <button type="button" class={toolClass} disabled={!canRedo} onClick={redo} aria-label="Redo" title="Redo">
                <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="m15 14 5-5-5-5" />
                  <path d="M20 9H10a6 6 0 0 0 0 12h3" />
                </svg>
              </button>
              <button type="button" class={toolClass} aria-pressed={design.night} onClick={() => update((d) => ({ ...d, night: !d.night }))}>
                Night
              </button>
              {hasLights && (
                <button type="button" class={toolClass} aria-pressed={design.lit} onClick={() => update((d) => ({ ...d, lit: !d.lit }))}>
                  Lights
                </button>
              )}
            </div>
            <a
              href={waHref}
              target="_blank"
              rel="noopener"
              data-wa-location="customizer-toolbar"
              data-wa-type="design"
              aria-label="Send on WhatsApp"
              title="Send on WhatsApp"
              onClick={onSend}
              class="flex size-11 shrink-0 items-center justify-center rounded-full bg-whatsapp text-whatsapp-ink"
            >
              <svg viewBox="0 0 24 24" class="size-6" aria-hidden="true">
                <path fill="currentColor" d={WA_ICON} />
              </svg>
            </a>
          </div>

          <p class="text-sm text-muted" data-readout>
            Sign area <strong class="text-ink">{sizeText}</strong>
            {letterText && (
              <>
                {' '}· letter height about <strong class="text-ink">{letterText}</strong>
              </>
            )}
            {estimate !== null && (
              <>
                {' '}· <strong class="text-ink">Estimated from Rs {estimate.toLocaleString('en-PK')}</strong>
              </>
            )}
          </p>
          <p class="sr-only" role="status" aria-live="polite">
            {notice}
          </p>
        </div>

        <div class="min-w-0 rounded-xl border border-line bg-white">
          <div role="tablist" aria-label="Design controls" class="flex overflow-x-auto border-b border-line">
            {TABS.map((t) => (
              <button
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="designer-panel"
                onClick={() => setTab(t.id)}
                class="min-h-12 flex-1 border-b-2 border-transparent px-2 text-sm font-semibold whitespace-nowrap text-muted aria-selected:border-ink aria-selected:text-ink sm:text-[0.95rem]"
              >
                {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="designer-panel" aria-labelledby={`tab-${tab}`} class="p-4">
            {notice && <p class="mb-4 rounded-lg bg-paper-soft px-3 py-2 text-sm">{notice}</p>}
            {tab === 'text' && (
              <>
                <TextPanel design={design} selectedId={activeLayer?.id ?? null} onSelect={setSelectedId} onText={setText} onAddText={addText} onAddLogo={addLogo} onRemove={removeLayer} />
                <div class="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4">
                  <button type="button" class={toolClass} onClick={() => templatesRef.current?.showModal()}>
                    Templates
                  </button>
                  <button type="button" class={toolClass} onClick={startOver}>
                    Start over
                  </button>
                </div>
              </>
            )}
            {tab === 'style' && (
              <StylePanel
                design={design}
                layer={activeLayer}
                onChange={updateLayer}
                onDesign={(patch) => update((d) => ({ ...d, ...patch }))}
                onOrder={orderLayer}
                onDuplicate={duplicateLayer}
                onCentre={centreLayer}
              />
            )}
            {tab === 'board' && (
              <BoardPanel
                design={design}
                onBoard={(patch) => update((d) => ({ ...d, board: { ...d.board, ...patch } }))}
                onResize={(size) => update((d) => resizeBoard(d, size.widthIn ?? d.board.widthIn, size.heightIn ?? d.board.heightIn))}
              />
            )}
            {tab === 'background' && (
              <BackgroundPanel
                design={design}
                onBackground={(background) => update((d) => ({ ...d, background }))}
                onUpload={uploadBackground}
                onNight={(night) => update((d) => ({ ...d, night }))}
              />
            )}
            {tab === 'export' && (
              <ExportPanel
                sizeText={sizeText}
                letterText={letterText}
                estimate={estimate}
                waHref={waHref}
                watermarkAvailable={watermarkText !== ''}
                watermark={watermark}
                onWatermark={setWatermark}
                onPng={exportPng}
                onSvg={exportSvg}
                onSave={saveFile}
                onLoad={loadFile}
                onSend={onSend}
              />
            )}
          </div>
        </div>
      </div>

      <dialog ref={templatesRef} aria-label="Starter templates" class="m-auto w-[min(34rem,92vw)] rounded-xl p-0 backdrop:bg-black/60">
        <div class="flex items-center justify-between border-b border-line px-4 py-2">
          <h2 class="text-lg font-bold">Start from a template</h2>
          <button type="button" class="min-h-11 px-3 font-medium underline" onClick={() => templatesRef.current?.close()}>
            Close
          </button>
        </div>
        <ul class="grid gap-2 p-4 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <li>
              <button type="button" onClick={() => useTemplate(t.id)} class="grid min-h-16 w-full gap-0.5 rounded-lg border border-line px-3 py-2 text-start hover:bg-paper-soft">
                <span class="font-semibold">{t.name}</span>
                <span class="text-sm text-muted">{t.description}</span>
              </button>
            </li>
          ))}
        </ul>
        <p class="px-4 pb-4 text-sm text-muted">A template replaces your current design. Undo brings it back.</p>
      </dialog>
    </div>
  );
}
