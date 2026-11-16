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
  effect: SignEffect;
  /** Glow colour for halo / neon / front-lit. */
  glowColor: string;
  /** Extrusion depth as a fraction of the font size. */
  depth: number;
  /** Lights on/off for the lit effects. */
  lit: boolean;
}

const LAYOUT_KEYS = ['text', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'direction'];
const OWN_KEYS: (keyof ShapedTextProps)[] = [
  'text',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'direction',
  'effect',
  'glowColor',
  'depth',
  'lit',
];

let measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCtx(): CanvasRenderingContext2D {
  measureCtx ??= document.createElement('canvas').getContext('2d')!;
  return measureCtx;
}

function shade(color: string, factor: number): string {
  const [r, g, b, a] = new Color(color).getSource();
  const f = (v: number) => Math.round(Math.max(0, Math.min(255, v * factor)));
  return `rgba(${f(r)},${f(g)},${f(b)},${a})`;
}

export class ShapedText extends FabricObject {
  static type = 'ShapedText';

  declare text: string;
  declare fontFamily: string;
  declare fontSize: number;
  declare fontWeight: string | number;
  declare lineHeight: number;
  declare textAlign: 'left' | 'center' | 'right';
  declare direction: 'auto' | 'ltr' | 'rtl';
  declare effect: SignEffect;
  declare glowColor: string;
  declare depth: number;
  declare lit: boolean;

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
    effect: 'flat',
    glowColor: '#ff2d95',
    depth: 0.12,
    lit: true,
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

  /** Recomputes the box from the shaped text. Call after the font has loaded. */
  remeasure(): void {
    const ctx = getMeasureCtx();
    ctx.font = this.fontDeclaration;
    ctx.direction = this.resolvedDirection;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

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

    this._ascent = ascent;
    this.width = Math.ceil(halfWidth * 2);
    this.height = Math.ceil(ascent + descent + (lines.length - 1) * this.fontSize * this.lineHeight);
    this.setCoords();
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

  private drawLines(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    mode: 'fill' | 'stroke' = 'fill',
  ): void {
    const advance = this.fontSize * this.lineHeight;
    const x = this.textAlign === 'left' ? -this.width / 2 : this.textAlign === 'right' ? this.width / 2 : 0;
    const y = -this.height / 2 + this._ascent;
    this.lines.forEach((line, i) => {
      // One call per line: the browser shapes the whole run.
      if (mode === 'fill') ctx.fillText(line, x + dx, y + dy + i * advance);
      else ctx.strokeText(line, x + dx, y + dy + i * advance);
    });
  }

  private glow(ctx: CanvasRenderingContext2D, color: string, blur: number, alpha: number, fill: string): void {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = blur * (this.fontSize / 100) * this.blurScale();
    ctx.fillStyle = fill;
    this.drawLines(ctx, 0, 0);
    ctx.restore();
  }

  private extrude(ctx: CanvasRenderingContext2D, face: string): void {
    const steps = Math.max(1, Math.round(this.fontSize * this.depth));
    ctx.fillStyle = shade(face, 0.45);
    for (let i = steps; i >= 1; i--) this.drawLines(ctx, i * 0.6, i * 0.8);
  }

  _render(ctx: CanvasRenderingContext2D): void {
    const face = typeof this.fill === 'string' ? this.fill : '#ffffff';
    ctx.font = this.fontDeclaration;
    ctx.direction = this.resolvedDirection;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';

    switch (this.effect) {
      case 'extrude':
      case 'front-lit': {
        this.extrude(ctx, face);
        if (this.effect === 'front-lit' && this.lit) this.glow(ctx, this.glowColor, 35, 0.9, face);
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
          // Light spills out from BEHIND a dark face.
          this.glow(ctx, this.glowColor, 60, 0.9, this.glowColor);
          this.glow(ctx, this.glowColor, 25, 1, this.glowColor);
        }
        ctx.fillStyle = face;
        this.drawLines(ctx, 0, 0);
        break;
      }
      case 'neon': {
        if (!this.lit) {
          ctx.fillStyle = shade(this.glowColor, 0.35);
          this.drawLines(ctx, 0, 0);
          break;
        }
        this.glow(ctx, this.glowColor, 60, 0.6, this.glowColor);
        this.glow(ctx, this.glowColor, 25, 1, this.glowColor);
        ctx.save();
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 8 * (this.fontSize / 100) * this.blurScale();
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = Math.max(1, this.fontSize * 0.04);
        this.drawLines(ctx, 0, 0, 'stroke');
        ctx.fillStyle = '#ffffff';
        this.drawLines(ctx, 0, 0);
        ctx.restore();
        break;
      }
      default: {
        ctx.fillStyle = face;
        this.drawLines(ctx, 0, 0);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toObject(propertiesToInclude: any[] = []): any {
    return super.toObject([...OWN_KEYS, ...propertiesToInclude]);
  }
}

classRegistry.setClass(ShapedText);
classRegistry.setClass(ShapedText, 'ShapedText');
