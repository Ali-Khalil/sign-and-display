/**
 * Fabric.js scene for the sign customizer. The design document is the source
 * of truth: `render(design)` makes the canvas match it, and user gestures on
 * the canvas are reported back through the handlers.
 */
import { Canvas, FabricImage, Gradient, Rect, Shadow, type FabricObject } from 'fabric';
import { ShapedText, type SignEffect } from './ShapedText';
import { CANVAS_H, CANVAS_W, type Design, type Layer, type TextLayer } from '../lib/design';
import { loadSignFont } from '../lib/fonts';
import { boardRect, type BoardRect } from '../lib/units';

export interface SceneHandlers {
  onSelect(id: string | null): void;
  onTransform(id: string, patch: Partial<Layer>): void;
  /** Double click / double tap on a text object. */
  onEditRequest(id: string): void;
}

type Tagged = FabricObject & { layerId?: string };

const HELPER = { selectable: false, evented: false, excludeFromExport: true } as const;
const SNAP = 10;

function effectFor(design: Design): SignEffect {
  switch (design.mode) {
    case 'flat-board':
      return 'flat';
    case '3d-letters':
      return 'extrude';
    case 'led':
      return design.lighting === 'halo' ? 'halo' : 'front-lit';
    case 'neon':
      return 'neon';
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = src;
  });
}

export class Scene {
  readonly canvas: Canvas;
  private design: Design | null = null;
  private objects = new Map<string, Tagged>();
  private pendingImages = new Set<string>();
  private backgroundKey = '';
  private flickerTimer = 0;
  private flickerLevel = 1;
  private disposed = false;

  private nightBack = new Rect({ ...HELPER, excludeFromExport: false, left: 0, top: 0, width: CANVAS_W, height: CANVAS_H, originX: 'left', originY: 'top', fill: '#05070c', opacity: 0.62 });
  private nightFront = new Rect({ ...HELPER, excludeFromExport: false, left: 0, top: 0, width: CANVAS_W, height: CANVAS_H, originX: 'left', originY: 'top', fill: '#05070c', opacity: 0.4 });
  private board = new Rect({ ...HELPER, excludeFromExport: false, originX: 'center', originY: 'center' });
  private area = new Rect({ ...HELPER, originX: 'center', originY: 'center', fill: '', stroke: 'rgba(255,255,255,0.55)', strokeWidth: 2, strokeDashArray: [10, 8] });
  private areaShade = new Rect({ ...HELPER, originX: 'center', originY: 'center', fill: '', stroke: 'rgba(0,0,0,0.45)', strokeWidth: 2, strokeDashArray: [10, 8], strokeDashOffset: 9 });
  private guideV = new Rect({ ...HELPER, originX: 'center', originY: 'top', top: 0, width: 2, height: CANVAS_H, fill: '#00d0ff', visible: false });
  private guideH = new Rect({ ...HELPER, originX: 'left', originY: 'center', left: 0, width: CANVAS_W, height: 2, fill: '#00d0ff', visible: false });

  constructor(el: HTMLCanvasElement, private handlers: SceneHandlers) {
    this.canvas = new Canvas(el, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: '#1a1d24',
      preserveObjectStacking: true,
      selection: false,
      uniformScaling: true,
      renderOnAddRemove: false,
      stopContextMenu: true,
    });
    this.canvas.add(this.nightBack, this.board, this.areaShade, this.area, this.nightFront, this.guideV, this.guideH);
    this.bindEvents();
  }

  private bindEvents(): void {
    const c = this.canvas;
    const selected = () => (c.getActiveObject() as Tagged | undefined)?.layerId ?? null;
    c.on('selection:created', () => this.handlers.onSelect(selected()));
    c.on('selection:updated', () => this.handlers.onSelect(selected()));
    c.on('selection:cleared', () => this.handlers.onSelect(null));
    c.on('mouse:dblclick', ({ target }) => {
      const id = (target as Tagged | undefined)?.layerId;
      if (id && target instanceof ShapedText) this.handlers.onEditRequest(id);
    });
    c.on('object:moving', ({ target }) => this.snap(target));
    c.on('mouse:up', () => this.hideGuides());
    c.on('object:modified', ({ target }) => {
      const obj = target as Tagged;
      const id = obj.layerId;
      if (!id) return;
      if (obj instanceof ShapedText) {
        // Fold handle scaling into the font size so the size control stays true.
        const scale = obj.scaleX ?? 1;
        const patch: Partial<TextLayer> = { x: obj.left, y: obj.top, angle: obj.angle };
        if (Math.abs(scale - 1) > 0.001) {
          patch.fontSize = Math.max(8, Math.round(obj.fontSize * scale));
          patch.outlineWidth = obj.outlineWidth * scale;
          obj.set({ scaleX: 1, scaleY: 1 });
        }
        this.handlers.onTransform(id, patch);
      } else {
        this.handlers.onTransform(id, { x: obj.left, y: obj.top, angle: obj.angle, scale: obj.scaleX });
      }
    });
  }

  private snap(target: FabricObject): void {
    if (!this.design) return;
    const rect = boardRect(this.design.board);
    const tolerance = SNAP / this.canvas.getZoom();
    const nearX = Math.abs(target.left - rect.cx) < tolerance;
    const nearY = Math.abs(target.top - rect.cy) < tolerance;
    if (nearX) target.set({ left: rect.cx });
    if (nearY) target.set({ top: rect.cy });
    this.guideV.set({ left: rect.cx, visible: nearX });
    this.guideH.set({ top: rect.cy, visible: nearY });
  }

  private hideGuides(): void {
    if (!this.guideV.visible && !this.guideH.visible) return;
    this.guideV.set({ visible: false });
    this.guideH.set({ visible: false });
    this.canvas.requestRenderAll();
  }

  /** Fit the fixed 1200 × 900 scene into `width` CSS pixels. */
  resize(width: number): void {
    const zoom = width / CANVAS_W;
    this.canvas.setDimensions({ width, height: Math.round(CANVAS_H * zoom) });
    this.canvas.setZoom(zoom);
    this.canvas.requestRenderAll();
  }

  select(id: string | null): void {
    const current = (this.canvas.getActiveObject() as Tagged | undefined)?.layerId ?? null;
    if (current === id) return;
    const obj = id ? this.objects.get(id) : undefined;
    if (obj) this.canvas.setActiveObject(obj);
    else this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  /** Make the canvas match the design. */
  render(design: Design): void {
    if (this.disposed) return;
    this.design = design;
    const rect = boardRect(design.board);
    const lightsOn = (design.mode === 'led' || design.mode === 'neon') && design.lit;

    this.updateBackground(design);
    this.nightBack.set({ visible: design.night });
    // At night an unlit sign is dim too.
    this.nightFront.set({ visible: design.night && !lightsOn });

    const seen = new Set<string>();
    const ordered: FabricObject[] = [];
    for (const layer of design.layers) {
      seen.add(layer.id);
      const obj = layer.type === 'text' ? this.syncText(layer, design) : this.syncImage(layer);
      if (obj) ordered.push(obj);
    }
    for (const [id, obj] of this.objects) {
      if (!seen.has(id)) {
        this.canvas.remove(obj);
        this.objects.delete(id);
      }
    }

    this.updateBoard(design, rect, ordered);
    [this.nightBack, this.board, this.areaShade, this.area, ...ordered, this.nightFront, this.guideV, this.guideH].forEach((obj, i) =>
      this.canvas.moveObjectTo(obj, i),
    );
    this.updateFlicker(design);
    this.canvas.requestRenderAll();
  }

  private syncText(layer: TextLayer, design: Design): ShapedText {
    let obj = this.objects.get(layer.id) as ShapedText | undefined;
    if (!obj) {
      obj = new ShapedText({ originX: 'center', originY: 'center', lockScalingFlip: true, padding: 6 });
      obj.setControlsVisibility({ ml: false, mr: false, mt: false, mb: false });
      (obj as Tagged).layerId = layer.id;
      this.objects.set(layer.id, obj);
      this.canvas.add(obj);
    }
    const effect = effectFor(design);
    obj.set({
      text: layer.text,
      fontFamily: layer.fontFamily,
      fontSize: layer.fontSize,
      lineHeight: layer.lineHeight,
      textAlign: layer.align,
      charSpacing: layer.charSpacing,
      effect,
      fill: layer.color,
      glowColor: layer.glow,
      lit: design.lit,
      glowLevel: (design.night ? 1 : 0.45) * this.flickerLevel,
      outlineColor: layer.outlineColor,
      outlineWidth: effect === 'neon' ? 0 : layer.outlineWidth,
      left: layer.x,
      top: layer.y,
      angle: layer.angle,
      scaleX: 1,
      scaleY: 1,
    });
    obj.setCoords();

    const target = obj;
    void loadSignFont(layer.fontFamily, layer.text).then(() => {
      if (this.disposed || !this.objects.has(layer.id)) return;
      target.remeasure();
      if (this.design?.board.shape === 'cut') this.render(this.design);
      else this.canvas.requestRenderAll();
    });
    return obj;
  }

  private syncImage(layer: Extract<Layer, { type: 'image' }>): FabricObject | null {
    const obj = this.objects.get(layer.id);
    if (obj) {
      obj.set({ left: layer.x, top: layer.y, angle: layer.angle, scaleX: layer.scale, scaleY: layer.scale });
      obj.setCoords();
      return obj;
    }
    if (!this.pendingImages.has(layer.id)) {
      this.pendingImages.add(layer.id);
      void loadImage(layer.src)
        .then((el) => {
          this.pendingImages.delete(layer.id);
          if (this.disposed || !this.design?.layers.some((l) => l.id === layer.id)) return;
          const image: Tagged = new FabricImage(el, { originX: 'center', originY: 'center', lockScalingFlip: true, padding: 6 });
          image.setControlsVisibility({ ml: false, mr: false, mt: false, mb: false });
          image.layerId = layer.id;
          this.objects.set(layer.id, image);
          this.canvas.add(image);
          this.render(this.design);
        })
        .catch(() => this.pendingImages.delete(layer.id));
    }
    return null;
  }

  private updateBoard(design: Design, rect: BoardRect, layerObjects: FabricObject[]): void {
    const { board } = design;
    let box = { cx: rect.cx, cy: rect.cy, width: rect.width, height: rect.height };

    if (board.shape === 'cut' && layerObjects.length) {
      // "Cut to shape" is approximated by a padded, rounded box around the lettering.
      const bounds = layerObjects.map((o) => o.getBoundingRect());
      const left = Math.min(...bounds.map((b) => b.left));
      const top = Math.min(...bounds.map((b) => b.top));
      const right = Math.max(...bounds.map((b) => b.left + b.width));
      const bottom = Math.max(...bounds.map((b) => b.top + b.height));
      const pad = Math.max(24, (bottom - top) * 0.18);
      box = { cx: (left + right) / 2, cy: (top + bottom) / 2, width: right - left + pad * 2, height: bottom - top + pad * 2 };
    }

    const radius =
      board.shape === 'pill' ? box.height / 2 : board.shape === 'rounded' ? Math.min(box.width, box.height) * 0.12 : board.shape === 'cut' ? Math.min(box.width, box.height) * 0.28 : 0;
    const borderWidth = board.border && board.style === 'solid' ? Math.max(6, Math.min(box.width, box.height) * 0.035) : 0;

    this.board.set({
      visible: board.style !== 'none',
      left: box.cx,
      top: box.cy,
      width: box.width - borderWidth,
      height: box.height - borderWidth,
      rx: radius,
      ry: radius,
      fill: board.style === 'clear' ? 'rgba(255,255,255,0.07)' : board.color,
      stroke:
        board.style === 'clear'
          ? 'rgba(255,255,255,0.3)'
          : borderWidth
            ? new Gradient({
                type: 'linear',
                gradientUnits: 'percentage',
                coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
                colorStops: [
                  { offset: 0, color: '#f4f5f7' },
                  { offset: 0.35, color: '#8d939c' },
                  { offset: 0.6, color: '#e9ebee' },
                  { offset: 1, color: '#7e848d' },
                ],
              })
            : '',
      strokeWidth: board.style === 'clear' ? 2 : borderWidth,
      shadow: board.style === 'solid' ? new Shadow({ color: 'rgba(0,0,0,0.45)', blur: 18, offsetX: 0, offsetY: 10 }) : null,
    });
    this.board.setCoords();

    // With no board, a dashed outline shows the sign area the size refers to.
    const showArea = board.style === 'none' || board.shape === 'cut';
    for (const outline of [this.area, this.areaShade]) {
      outline.set({ visible: showArea, left: rect.cx, top: rect.cy, width: rect.width, height: rect.height });
      outline.setCoords();
    }
  }

  private updateBackground(design: Design): void {
    const bg = design.background;
    const key = bg.kind === 'preset' ? `preset:${bg.id}` : `upload:${bg.src.length}:${bg.src.slice(-32)}`;
    if (key === this.backgroundKey) return;
    this.backgroundKey = key;
    const src = bg.kind === 'preset' ? `/customizer/backgrounds/${bg.id}.jpg` : bg.src;
    void loadImage(src)
      .then((el) => {
        if (this.disposed || this.backgroundKey !== key) return;
        const scale = Math.max(CANVAS_W / el.naturalWidth, CANVAS_H / el.naturalHeight);
        this.canvas.backgroundImage = new FabricImage(el, {
          originX: 'center',
          originY: 'center',
          left: CANVAS_W / 2,
          top: CANVAS_H / 2,
          scaleX: scale,
          scaleY: scale,
        });
        this.canvas.requestRenderAll();
      })
      .catch(() => {
        this.backgroundKey = '';
      });
  }

  /** Subtle, occasional neon flicker. Off when the user prefers reduced motion. */
  private updateFlicker(design: Design): void {
    const wanted =
      design.mode === 'neon' && design.lit && design.flicker && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!wanted) {
      window.clearTimeout(this.flickerTimer);
      this.flickerTimer = 0;
      if (this.flickerLevel !== 1) {
        this.flickerLevel = 1;
        this.applyGlowLevel();
      }
      return;
    }
    if (this.flickerTimer) return;
    const tick = () => {
      if (this.disposed) return;
      const dip = this.flickerLevel === 1 && Math.random() < 0.35;
      this.flickerLevel = dip ? 0.55 + Math.random() * 0.25 : 1;
      this.applyGlowLevel();
      this.flickerTimer = window.setTimeout(tick, dip ? 60 + Math.random() * 90 : 500 + Math.random() * 2200);
    };
    this.flickerTimer = window.setTimeout(tick, 800);
  }

  private applyGlowLevel(): void {
    const base = this.design?.night ? 1 : 0.45;
    for (const obj of this.objects.values()) if (obj instanceof ShapedText) obj.set({ glowLevel: base * this.flickerLevel });
    this.canvas.requestRenderAll();
  }

  /** Approximate real letter height of a text layer, in inches. */
  letterHeightIn(id: string | null): number | null {
    if (!this.design) return null;
    const obj = (id && this.objects.get(id)) || [...this.objects.values()].find((o) => o instanceof ShapedText);
    if (!(obj instanceof ShapedText)) return null;
    return obj.letterHeight() / boardRect(this.design.board).pxPerInch;
  }

  private withCleanCanvas<T>(hide: FabricObject[], fn: () => T): T {
    const active = this.canvas.getActiveObject();
    const flicker = this.flickerLevel;
    this.flickerLevel = 1;
    for (const obj of this.objects.values()) if (obj instanceof ShapedText) obj.set({ glowLevel: this.design?.night ? 1 : 0.45 });
    const hidden = hide.filter((o) => o.visible);
    hidden.forEach((o) => o.set({ visible: false }));
    if (active) this.canvas.discardActiveObject();
    try {
      return fn();
    } finally {
      hidden.forEach((o) => o.set({ visible: true }));
      this.flickerLevel = flicker;
      if (active) this.canvas.setActiveObject(active);
      this.canvas.requestRenderAll();
    }
  }

  /** PNG of the whole scene. `width` is the output width in pixels (2400 = 2×). */
  toPNG(width = CANVAS_W * 2, watermark = ''): string {
    return this.withCleanCanvas([this.area, this.areaShade, this.guideV, this.guideH], () => {
      const el = this.canvas.toCanvasElement(width / this.canvas.getWidth());
      if (watermark) {
        const ctx = el.getContext('2d')!;
        const size = Math.round(el.width * 0.016);
        ctx.font = `600 ${size}px system-ui, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillText(watermark, el.width - size + 2, el.height - size * 0.8 + 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(watermark, el.width - size, el.height - size * 0.8);
      }
      return el.toDataURL('image/png');
    });
  }

  /** SVG of the sign only (no wall photo, no night shading), for designers. */
  toSVG(): string {
    return this.withCleanCanvas([this.nightBack, this.nightFront], () => {
      const background = this.canvas.backgroundImage;
      const color = this.canvas.backgroundColor;
      const vpt = this.canvas.viewportTransform;
      this.canvas.backgroundImage = undefined;
      this.canvas.backgroundColor = '';
      this.nightBack.excludeFromExport = this.nightFront.excludeFromExport = true;
      this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
      try {
        return this.canvas.toSVG({ width: String(CANVAS_W), height: String(CANVAS_H), viewBox: { x: 0, y: 0, width: CANVAS_W, height: CANVAS_H } });
      } finally {
        this.canvas.backgroundImage = background;
        this.canvas.backgroundColor = color;
        this.canvas.viewportTransform = vpt;
        this.nightBack.excludeFromExport = this.nightFront.excludeFromExport = false;
      }
    });
  }

  dispose(): void {
    this.disposed = true;
    window.clearTimeout(this.flickerTimer);
    void this.canvas.dispose();
  }
}
