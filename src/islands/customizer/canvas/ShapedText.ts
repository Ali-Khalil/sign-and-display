import { Color, FabricObject, classRegistry } from 'fabric';
import { isolateNumbers, textDirection } from '../lib/rtl';

/**
 * Sign text that is shaped by the browser, not by Fabric.
 *
 * Each line is drawn with ONE `ctx.fillText()` call and measured with
 * `ctx.measureText()` on the whole line, so the browser's text shaper
 * (HarfBuzz) handles Arabic joining, Nastaliq ligatures and mixed
 * Urdu/English/digit ordering. The bounding box comes from the real ink
 * bounds, so tall Nastaliq ascenders/descenders are never clipped.
 *
 * The sign effects (3D extrusion, front-lit, halo-lit, neon) are part of the
 * object, so users never have to edit text inside a Group.
 */
export type SignEffect = 'flat' | 'extrude' | 'front-lit' | 'halo' | 'neon';

export interface ShapedTextProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  /** 'auto' = RTL whenever Arabic script is present. */
  direction: 'auto' | 'ltr' | 'rtl';
  /** Letter spacing in 1/1000 em. Ignored for RTL text: it would break letter joining. */
  charSpacing: number;
  effect: SignEffect;
  /** Glow colour for halo / neon / front-lit. */
  glowColor: string;
  /** Extrusion depth as a fraction of the font size. */
  depth: number;
  /** Lights on/off for the lit effects. */
  lit: boolean;
  /** 0–1 strength of the glow (daylight and flicker lower it). */
  glowLevel: number;
  outlineColor: string;
  /** Outline width in object units; 0 = none. */
  outlineWidth: number;
}

const LAYOUT_KEYS = ['text', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'direction', 'charSpacing', 'outlineWidth'];
const OWN_KEYS: (keyof ShapedTextProps)[] = [
  'text',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'direction',
  'charSpacing',
  'effect',
  'glowColor',
  'depth',
  'lit',
  'glowLevel',
  'outlineColor',
  'outlineWidth',
];

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string };

let measureCtx: Ctx | null = null;
function getMeasureCtx(): Ctx {
  measureCtx ??= document.createElement('canvas').getContext('2d')!;
  return measureCtx;
}

function shade(color: string, factor: number): string {
  const [r, g, b, a] = new Color(color).getSource();
  const f = (v: number) => Math.round(Math.max(0, Math.min(255, v * factor)));
  return `rgba(${f(r)},${f(g)},${f(b)},${a})`;
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export class ShapedText extends FabricObject {
  static type = 'ShapedText';

  declare text: string;
  declare fontFamily: string;
  declare fontSize: number;
  declare fontWeight: string | number;
  declare lineHeight: number;
  declare textAlign: 'left' | 'center' | 'right';
  declare direction: 'auto' | 'ltr' | 'rtl';
  declare charSpacing: number;
  declare effect: SignEffect;
  declare glowColor: string;
  declare depth: number;
  declare lit: boolean;
  declare glowLevel: number;
  declare outlineColor: string;
  declare outlineWidth: number;

  /** Distance from the top of the box to the first baseline. */
  private _ascent = 0;

  static signDefaults: Partial<ShapedTextProps> & Record<string, unknown> = {
    text: '',
    fontFamily: 'sans-serif',
    fontSize: 40,
    fontWeight: 'normal',
    lineHeight: 1.2,
    textAlign: 'center',
    direction: 'auto',
    charSpacing: 0,
    effect: 'flat',
    glowColor: '#ff2d95',
    depth: 0.12,
    lit: true,
    glowLevel: 1,
    outlineColor: '#000000',
    outlineWidth: 0,
    strokeWidth: 0,
    // Glows extend past the box, and the object cache would clip them.
    objectCaching: false,
  };

  static getDefaults(): Record<string, unknown> {
    return { ...super.getDefaults(), ...ShapedText.signDefaults };
  }

  constructor(options: Partial<ShapedTextProps> & Record<string, unknown> = {}) {
    super();
    Object.assign(this, ShapedText.signDefaults);
    this.setOptions(options);
    this.remeasure();
  }

  get resolvedDirection(): 'ltr' | 'rtl' {
    return this.direction === 'auto' ? textDirection(this.text) : this.direction;
  }

  /** Lines as drawn: phone numbers are bidi-isolated in RTL text. */
  get lines(): string[] {
    const text = this.resolvedDirection === 'rtl' ? isolateNumbers(this.text) : this.text;
    return text.split('\n');
  }

  private get fontDeclaration(): string {
    return `${this.fontWeight} ${this.fontSize}px "${this.fontFamily}", sans-serif`;
  }

  /** Letter spacing in px; always 0 for RTL so Arabic letters keep joining. */
  private get spacingPx(): number {
    return this.resolvedDirection === 'rtl' ? 0 : (this.charSpacing / 1000) * this.fontSize;
  }

  private applyFont(ctx: Ctx): void {
    ctx.font = this.fontDeclaration;
    ctx.direction = this.resolvedDirection;
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${this.spacingPx}px`;
  }

  /** Recomputes the box from the shaped text. Call after the font has loaded. */
  remeasure(): void {
    const ctx = getMeasureCtx();
    this.applyFont(ctx);
    ctx.textAlign = 'center';

    const lines = this.lines;
    let halfWidth = 0;
    let ascent = 0;
    let descent = 0;
    lines.forEach((line, i) => {
      const m = ctx.measureText(line || ' ');
      halfWidth = Math.max(halfWidth, m.width / 2, m.actualBoundingBoxLeft, m.actualBoundingBoxRight);
      if (i === 0) ascent = m.actualBoundingBoxAscent;
      if (i === lines.length - 1) descent = m.actualBoundingBoxDescent;
    });

    const pad = this.outlineWidth;
    this._ascent = ascent + pad;
    this.width = Math.ceil(halfWidth * 2 + pad * 2);
    this.height = Math.ceil(ascent + descent + pad * 2 + (lines.length - 1) * this.fontSize * this.lineHeight);
    this.setCoords();
  }

  /** Height of a capital letter (or of the first line's ink for Urdu), in object units. */
  letterHeight(): number {
    const ctx = getMeasureCtx();
    this.applyFont(ctx);
    const sample = this.resolvedDirection === 'rtl' ? this.lines[0] || ' ' : 'H';
    const m = ctx.measureText(sample);
    return m.actualBoundingBoxAscent + (this.resolvedDirection === 'rtl' ? m.actualBoundingBoxDescent : 0);
  }

  _set(key: string, value: unknown): this {
    super._set(key, value);
    if (LAYOUT_KEYS.includes(key) && this.text !== undefined) this.remeasure();
    return this;
  }

  /** Canvas blur radii ignore transforms, so scale them by hand. */
  private blurScale(): number {
    const scaling = this.getObjectScaling();
    const zoom = this.canvas?.getZoom() ?? 1;
    const retina = this.canvas?.getRetinaScaling() ?? 1;
    return ((scaling.x + scaling.y) / 2) * zoom * retina;
  }

  private lineX(): number {
    const pad = this.outlineWidth;
    return this.textAlign === 'left' ? -this.width / 2 + pad : this.textAlign === 'right' ? this.width / 2 - pad : 0;
  }

  private drawLines(ctx: Ctx, dx: number, dy: number, mode: 'fill' | 'stroke' = 'fill'): void {
    const advance = this.fontSize * this.lineHeight;
    const x = this.lineX();
    const y = -this.height / 2 + this._ascent;
    this.lines.forEach((line, i) => {
      // One call per line: the browser shapes the whole run.
      if (mode === 'fill') ctx.fillText(line, x + dx, y + dy + i * advance);
      else ctx.strokeText(line, x + dx, y + dy + i * advance);
    });
  }

  private glow(ctx: Ctx, color: string, blur: number, alpha: number, fill: string): void {
    if (this.glowLevel <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha * this.glowLevel;
    ctx.shadowColor = color;
    ctx.shadowBlur = blur * (this.fontSize / 100) * this.blurScale();
    ctx.fillStyle = fill;
    this.drawLines(ctx, 0, 0);
    ctx.restore();
  }

  private extrude(ctx: Ctx, face: string): void {
    const steps = Math.max(1, Math.round(this.fontSize * this.depth));
    ctx.fillStyle = shade(face, 0.45);
    for (let i = steps; i >= 1; i--) this.drawLines(ctx, i * 0.6, i * 0.8);
  }

  private outline(ctx: Ctx): void {
    if (this.outlineWidth <= 0) return;
    ctx.strokeStyle = this.outlineColor;
    ctx.lineWidth = this.outlineWidth * 2; // half is hidden under the fill
    this.drawLines(ctx, 0, 0, 'stroke');
  }

  _render(ctx: Ctx): void {
    const face = typeof this.fill === 'string' ? this.fill : '#ffffff';
    this.applyFont(ctx);
    ctx.textAlign = this.textAlign;
    ctx.lineJoin = 'round';

    switch (this.effect) {
      case 'extrude':
      case 'front-lit': {
        const lit = this.effect === 'front-lit' && this.lit;
        this.extrude(ctx, face);
        if (lit) this.glow(ctx, this.glowColor, 35, 0.9, this.glowColor);
        this.outline(ctx);
        ctx.fillStyle = face;
        this.drawLines(ctx, 0, 0);
        // Light top highlight on the face edge.
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = Math.max(0.5, this.fontSize * 0.012);
        this.drawLines(ctx, -0.4, -0.4, 'stroke');
        break;
      }
      case 'halo': {
        if (this.lit) {
          // Light spills out from BEHIND a solid face.
          this.glow(ctx, this.glowColor, 60, 0.9, this.glowColor);
          this.glow(ctx, this.glowColor, 25, 1, this.glowColor);
        }
        this.outline(ctx);
        ctx.fillStyle = face;
        this.drawLines(ctx, 0, 0);
        break;
      }
      case 'neon': {
        const tube = Math.max(1, this.fontSize * 0.04);
        if (!this.lit) {
          // Unlit tube: a dull line in the tube colour.
          ctx.strokeStyle = shade(this.glowColor, 0.45);
          ctx.lineWidth = tube;
          this.drawLines(ctx, 0, 0, 'stroke');
          ctx.fillStyle = shade(this.glowColor, 0.3);
          this.drawLines(ctx, 0, 0);
          break;
        }
        this.glow(ctx, this.glowColor, 60, 0.6, this.glowColor);
        this.glow(ctx, this.glowColor, 25, 1, this.glowColor);
        ctx.save();
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 8 * (this.fontSize / 100) * this.blurScale() * Math.max(0.3, this.glowLevel);
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = tube;
        this.drawLines(ctx, 0, 0, 'stroke');
        ctx.fillStyle = '#ffffff';
        this.drawLines(ctx, 0, 0);
        ctx.restore();
        break;
      }
      default: {
        this.outline(ctx);
        ctx.fillStyle = face;
        this.drawLines(ctx, 0, 0);
      }
    }
  }

  /**
   * SVG for designers: real <text> (fonts must be installed), the extrusion
   * as a darker offset copy, and neon as a stroked line. Glows are left out.
   */
  _toSVG(): string[] {
    const face = typeof this.fill === 'string' ? this.fill : '#ffffff';
    const anchor = this.textAlign === 'left' ? 'start' : this.textAlign === 'right' ? 'end' : 'middle';
    const advance = this.fontSize * this.lineHeight;
    const y0 = -this.height / 2 + this._ascent;
    const attrs = [
      `font-family="${escapeXml(this.fontFamily)}"`,
      `font-size="${this.fontSize}"`,
      `font-weight="${this.fontWeight}"`,
      `text-anchor="${anchor}"`,
      `direction="${this.resolvedDirection}"`,
      this.spacingPx ? `letter-spacing="${this.spacingPx}"` : '',
      'xml:space="preserve"',
    ].join(' ');
    const lines = (dx: number, dy: number, paint: string) =>
      this.text
        .split('\n')
        .map((line, i) => `<text ${attrs} x="${this.lineX() + dx}" y="${y0 + dy + i * advance}" ${paint}>${escapeXml(line)}</text>\n`)
        .join('');

    const out: string[] = [];
    if (this.effect === 'extrude' || this.effect === 'front-lit') {
      const depth = Math.max(1, Math.round(this.fontSize * this.depth));
      out.push(lines(depth * 0.6, depth * 0.8, `fill="${shade(face, 0.45)}"`));
    }
    if (this.effect === 'neon') {
      out.push(lines(0, 0, `fill="#ffffff" stroke="${this.glowColor}" stroke-width="${Math.max(1, this.fontSize * 0.04)}" stroke-linejoin="round"`));
    } else {
      const stroke = this.outlineWidth > 0 ? ` stroke="${this.outlineColor}" stroke-width="${this.outlineWidth * 2}" paint-order="stroke" stroke-linejoin="round"` : '';
      out.push(lines(0, 0, `fill="${face}"${stroke}`));
    }
    return out;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toObject(propertiesToInclude: any[] = []): any {
    return super.toObject([...OWN_KEYS, ...propertiesToInclude]);
  }
}

classRegistry.setClass(ShapedText);
classRegistry.setClass(ShapedText, 'ShapedText');
