/**
 * Phase 0 spike: can Fabric.js render Urdu correctly?
 *
 * For every Urdu font it draws the five test strings in five sign effects,
 * twice: once with Fabric's native text object and once with the ShapedText
 * fallback. A plain HTML <p dir="rtl"> is the reference. Numeric checks are
 * published on window.__spike for the Playwright script.
 */
import { Canvas, FabricText, Rect, Shadow, StaticCanvas, type FabricObject } from 'fabric';
import { ShapedText, type SignEffect } from '../islands/customizer/canvas/ShapedText';
import { loadSignFont } from '../islands/customizer/lib/fonts';
import { signFonts } from '../config/fonts';
import { isolateNumbers } from '../islands/customizer/lib/rtl';

const STRINGS = [
  'مدینہ ٹریڈرز',
  'الحمد للہ جنرل اسٹور',
  'بسم اللہ الرحمن الرحیم',
  'مدینہ ٹریڈرز 0300-1234567',
  'Al-Madina Traders مدینہ ٹریڈرز',
];
const EFFECTS: SignEffect[] = ['flat', 'extrude', 'front-lit', 'halo', 'neon'];
const CELL_W = 400;
const CELL_H = 130;
const FONT_SIZE = 26;
const BG = '#14161b';
const FACE: Record<SignEffect, string> = {
  flat: '#ffffff',
  extrude: '#f5b301',
  'front-lit': '#fff3c4',
  halo: '#23262d',
  neon: '#ffffff',
};
const GLOW: Record<SignEffect, string> = {
  flat: '#000000',
  extrude: '#000000',
  'front-lit': '#ffd76a',
  halo: '#4cc9ff',
  neon: '#ff2d95',
};

function nativeObjects(text: string, family: string, effect: SignEffect, cx: number, cy: number): FabricObject[] {
  const base = {
    fontFamily: family,
    fontSize: FONT_SIZE,
    direction: 'rtl' as const,
    textAlign: 'center' as const,
    originX: 'center' as const,
    originY: 'center' as const,
    left: cx,
    top: cy,
    charSpacing: 0,
  };
  const make = (opts: Record<string, unknown>) => new FabricText(text, { ...base, ...opts });
  const out: FabricObject[] = [];
  const extrude = () => {
    for (let i = 3; i >= 1; i--) out.push(make({ fill: '#6e5000', left: cx + i * 0.6, top: cy + i * 0.8 }));
  };
  switch (effect) {
    case 'flat':
      out.push(make({ fill: FACE.flat }));
      break;
    case 'extrude':
      extrude();
      out.push(make({ fill: FACE.extrude }));
      break;
    case 'front-lit':
      extrude();
      out.push(make({ fill: FACE['front-lit'], shadow: new Shadow({ color: GLOW['front-lit'], blur: 9 }) }));
      break;
    case 'halo':
      out.push(make({ fill: GLOW.halo, shadow: new Shadow({ color: GLOW.halo, blur: 16 }) }));
      out.push(make({ fill: FACE.halo }));
      break;
    case 'neon':
      out.push(make({ fill: GLOW.neon, opacity: 0.6, shadow: new Shadow({ color: GLOW.neon, blur: 16 }) }));
      out.push(make({ fill: GLOW.neon, shadow: new Shadow({ color: GLOW.neon, blur: 7 }) }));
      out.push(make({ fill: '#ffffff', stroke: GLOW.neon, strokeWidth: 1, paintFirst: 'stroke', shadow: new Shadow({ color: GLOW.neon, blur: 2 }) }));
      break;
  }
  return out;
}

function shapedObject(text: string, family: string, effect: SignEffect, cx: number, cy: number): ShapedText {
  return new ShapedText({
    text,
    fontFamily: family,
    fontSize: FONT_SIZE,
    effect,
    fill: FACE[effect],
    glowColor: GLOW[effect],
    originX: 'center',
    originY: 'center',
    left: cx,
    top: cy,
  });
}

function outline(obj: FabricObject): Rect {
  const r = obj.getBoundingRect();
  return new Rect({
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
    originX: 'left',
    originY: 'top',
    fill: '',
    stroke: '#3ddc84',
    strokeWidth: 1,
    strokeDashArray: [4, 3],
    opacity: 0.7,
  });
}

function buildGrid(el: HTMLCanvasElement, family: string, kind: 'native' | 'shaped', caching: boolean, boxes = true): StaticCanvas {
  const canvas = new StaticCanvas(el, {
    width: CELL_W * EFFECTS.length,
    height: CELL_H * STRINGS.length,
    backgroundColor: BG,
    enableRetinaScaling: false,
    renderOnAddRemove: false,
  });
  STRINGS.forEach((text, row) => {
    EFFECTS.forEach((effect, col) => {
      const cx = col * CELL_W + CELL_W / 2;
      const cy = row * CELL_H + CELL_H / 2;
      const objs = kind === 'native' ? nativeObjects(text, family, effect, cx, cy) : [shapedObject(text, family, effect, cx, cy)];
      if (kind === 'native') objs.forEach((o) => o.set({ objectCaching: caching }));
      canvas.add(...objs);
      if (boxes) canvas.add(outline(objs[objs.length - 1]!));
    });
  });
  canvas.renderAll();
  return canvas;
}

function pixelDiffRatio(a: HTMLCanvasElement, b: HTMLCanvasElement): number {
  const da = a.getContext('2d')!.getImageData(0, 0, a.width, a.height).data;
  const db = b.getContext('2d')!.getImageData(0, 0, b.width, b.height).data;
  let diff = 0;
  for (let i = 0; i < da.length; i += 4) {
    if (Math.abs(da[i]! - db[i]!) + Math.abs(da[i + 1]! - db[i + 1]!) + Math.abs(da[i + 2]! - db[i + 2]!) > 48) diff++;
  }
  return diff / (da.length / 4);
}

/** Rows of ink outside [top, bottom] in a tight single-string render = clipping risk. */
function inkBounds(family: string, text: string): { width: number; ascent: number; descent: number } {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.font = `${FONT_SIZE}px "${family}"`;
  ctx.direction = 'rtl';
  const m = ctx.measureText(text);
  return { width: m.width, ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent };
}

interface StringResult {
  text: string;
  browserWidth: number;
  browserInkHeight: number;
  nativeWidth: number;
  nativeHeight: number;
  nativeWidthRatio: number;
  /** Ink that falls outside Fabric's native text box (px above / below). */
  nativeOverflowTop: number;
  nativeOverflowBottom: number;
  shapedWidth: number;
  shapedHeight: number;
}

interface FontResult {
  family: string;
  strings: StringResult[];
  /** Share of pixels that change when Fabric's object cache is on (clipping). */
  nativeCacheClipRatio: number;
  shapedJsonRoundTrip: boolean;
}

async function run(): Promise<void> {
  const root = document.getElementById('spike-root')!;
  const results: FontResult[] = [];
  const urduFonts = signFonts.filter((f) => f.category === 'urdu');

  for (const font of urduFonts) {
    await loadSignFont(font.family, STRINGS.join(' '));
    const slug = font.family.toLowerCase().replace(/\s+/g, '-');

    const section = document.createElement('section');
    section.className = 'spike-font';
    section.innerHTML = `<h2>${font.family}</h2>
      <h3>1. Browser reference: plain HTML &lt;p dir="rtl"&gt;</h3>
      <div class="ref" id="ref-${slug}"></div>
      <h3>2. Fabric native text (direction: rtl, charSpacing 0)</h3>
      <div class="scroll"><canvas id="native-${slug}"></canvas></div>
      <h3>3. ShapedText fallback (one fillText per line)</h3>
      <div class="scroll"><canvas id="shaped-${slug}"></canvas></div>`;
    root.append(section);

    const ref = section.querySelector('.ref')!;
    for (const text of STRINGS) {
      const p = document.createElement('p');
      p.dir = 'rtl';
      p.textContent = text;
      p.style.fontFamily = `"${font.family}"`;
      p.style.fontSize = `${FONT_SIZE}px`;
      ref.append(p);
    }
    // Extra row: the phone-number string with the bidi fix ShapedText applies.
    const fixed = ref.children[3]!.cloneNode(true) as HTMLParagraphElement;
    fixed.textContent = isolateNumbers(STRINGS[3]!);
    fixed.title = 'with number isolation';
    ref.append(fixed);

    const nativeEl = section.querySelector<HTMLCanvasElement>(`#native-${slug}`)!;
    const shapedEl = section.querySelector<HTMLCanvasElement>(`#shaped-${slug}`)!;
    buildGrid(nativeEl, font.family, 'native', true);
    const shaped = buildGrid(shapedEl, font.family, 'shaped', false);

    // Clipping check: same native grid with and without the object cache.
    const cachedEl = document.createElement('canvas');
    const uncachedEl = document.createElement('canvas');
    buildGrid(cachedEl, font.family, 'native', true, false);
    buildGrid(uncachedEl, font.family, 'native', false, false);
    const nativeCacheClipRatio = pixelDiffRatio(cachedEl, uncachedEl);

    // Serialisation check for the custom class.
    const json = shaped.toJSON();
    const copyEl = document.createElement('canvas');
    const copy = new StaticCanvas(copyEl, { width: shaped.width, height: shaped.height, enableRetinaScaling: false });
    await copy.loadFromJSON(json);
    copy.renderAll();
    const shapedJsonRoundTrip =
      copy.getObjects().filter((o) => o instanceof ShapedText).length === STRINGS.length * EFFECTS.length &&
      pixelDiffRatio(shapedEl, copyEl) < 0.001;

    const strings = STRINGS.map((text): StringResult => {
      const ink = inkBounds(font.family, text);
      const native = new FabricText(text, { fontFamily: font.family, fontSize: FONT_SIZE, direction: 'rtl' });
      const st = new ShapedText({ text, fontFamily: font.family, fontSize: FONT_SIZE });
      const nativeBaseline = native.fontSize * (1 - native._fontSizeFraction); // distance from box top
      return {
        text,
        browserWidth: +ink.width.toFixed(1),
        browserInkHeight: +(ink.ascent + ink.descent).toFixed(1),
        nativeWidth: +native.width.toFixed(1),
        nativeHeight: +native.height.toFixed(1),
        nativeWidthRatio: +(native.width / ink.width).toFixed(3),
        nativeOverflowTop: +Math.max(0, ink.ascent - nativeBaseline).toFixed(1),
        nativeOverflowBottom: +Math.max(0, ink.descent - (native.height - nativeBaseline)).toFixed(1),
        shapedWidth: st.width,
        shapedHeight: st.height,
      };
    });

    results.push({ family: font.family, strings, nativeCacheClipRatio: +nativeCacheClipRatio.toFixed(5), shapedJsonRoundTrip });
  }

  // Interactive canvas: selection handles on a native and a ShapedText object.
  const family = urduFonts[0]!.family;
  const handlesEl = document.getElementById('handles') as HTMLCanvasElement;
  const handles = new Canvas(handlesEl, { width: 900, height: 260, backgroundColor: BG, enableRetinaScaling: false });
  const n = new FabricText(STRINGS[2]!, {
    fontFamily: family, fontSize: 40, direction: 'rtl', fill: '#fff', left: 225, top: 130, originX: 'center', originY: 'center',
  });
  const s = new ShapedText({
    text: STRINGS[2]!, fontFamily: family, fontSize: 40, effect: 'neon', glowColor: '#ff2d95', left: 675, top: 130, originX: 'center', originY: 'center',
  });
  handles.add(n, s);
  n.set({ borderColor: '#3ddc84', cornerColor: '#3ddc84' });
  s.set({ borderColor: '#3ddc84', cornerColor: '#3ddc84' });
  // Show both sets of handles at once.
  handles.on('after:render', ({ ctx }) => {
    for (const o of [n, s]) o._renderControls(ctx, { hasControls: true });
  });
  handles.requestRenderAll();

  const w = window as unknown as { __spike: { done: boolean; results: FontResult[] } };
  w.__spike = { done: true, results };
  document.getElementById('spike-status')!.textContent = 'Spike finished.';
  document.getElementById('spike-json')!.textContent = JSON.stringify(results, null, 2);
}

run().catch((err) => {
  console.error(err);
  document.getElementById('spike-status')!.textContent = `Spike failed: ${String(err)}`;
  (window as unknown as { __spike: unknown }).__spike = { done: true, error: String(err), results: [] };
});
