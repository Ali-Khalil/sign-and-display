/**
 * The design document: everything needed to redraw a sign. It is what gets
 * autosaved, snapshotted for undo/redo and written to "Save design" files.
 * Positions and font sizes are in canvas units (the canvas is 1200 × 900).
 */
import { DEFAULT_FONT, DEFAULT_NEON_FONT, DEFAULT_URDU_FONT, getFont } from '../../../config/fonts';
import { hasArabicScript } from './rtl';
import { boardRect } from './units';

export type Mode = 'flat-board' | '3d-letters' | 'led' | 'neon';

export const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'flat-board', label: 'Flat board', hint: 'ACP or aluminium-frame board with flat lettering' },
  { id: '3d-letters', label: '3D letters', hint: 'Raised acrylic letters, not lit' },
  { id: 'led', label: 'LED', hint: '3D letters with front or halo lighting' },
  { id: 'neon', label: 'Neon', hint: 'LED neon flex on an acrylic backing' },
];

export const CANVAS_W = 1200;
export const CANVAS_H = 900;
export const MAX_LAYERS = 8;

export interface TextLayer {
  id: string;
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  /** Face colour (flat, 3D, LED) . */
  color: string;
  /** Light colour: neon tube, halo or front-lit glow. */
  glow: string;
  align: 'left' | 'center' | 'right';
  /** Letter spacing in 1/1000 em. Always 0 for Urdu. */
  charSpacing: number;
  lineHeight: number;
  outlineColor: string;
  /** Outline width in canvas units; 0 = none. */
  outlineWidth: number;
  x: number;
  y: number;
  angle: number;
}

export interface ImageLayer {
  id: string;
  type: 'image';
  /** Data URL. The file never leaves the browser. */
  src: string;
  name: string;
  x: number;
  y: number;
  scale: number;
  angle: number;
}

export type Layer = TextLayer | ImageLayer;

export interface Board {
  widthIn: number;
  heightIn: number;
  /** none = letters straight on the wall; clear = clear acrylic backing. */
  style: 'none' | 'solid' | 'clear';
  /** cut = backing cut around the lettering (approximated by a padded rounded box). */
  shape: 'rect' | 'rounded' | 'pill' | 'cut';
  color: string;
  /** Aluminium border. */
  border: boolean;
}

export type Background = { kind: 'preset'; id: string } | { kind: 'upload'; src: string };

export interface Design {
  app: 'sign-designer';
  version: 1;
  mode: Mode;
  lighting: 'front-lit' | 'halo';
  /** Lights on (LED and neon). */
  lit: boolean;
  flicker: boolean;
  night: boolean;
  board: Board;
  background: Background;
  layers: Layer[];
}

export const BACKGROUNDS = [
  { id: 'plaster', label: 'Plaster wall' },
  { id: 'dark-wall', label: 'Dark wall' },
  { id: 'brick', label: 'Brick wall' },
  { id: 'shopfront-night', label: 'Shopfront at night' },
  { id: 'office', label: 'Office wall' },
];

export const NEON_COLOURS = [
  { name: 'Warm white', value: '#ffe9c4' },
  { name: 'Cool white', value: '#eaf4ff' },
  { name: 'Red', value: '#ff2a2a' },
  { name: 'Pink', value: '#ff2d95' },
  { name: 'Purple', value: '#b14dff' },
  { name: 'Blue', value: '#2f6bff' },
  { name: 'Ice blue', value: '#7df9ff' },
  { name: 'Green', value: '#39ff6a' },
  { name: 'Yellow', value: '#fff23d' },
  { name: 'Orange', value: '#ff8a1f' },
];

export const FACE_COLOURS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#16181d' },
  { name: 'Red', value: '#d0202a' },
  { name: 'Gold', value: '#f5b301' },
  { name: 'Blue', value: '#1f4fbf' },
  { name: 'Green', value: '#0f7a4d' },
  { name: 'Silver', value: '#c9ced6' },
  { name: 'Orange', value: '#f26b1d' },
];

export const BOARD_COLOURS = [
  { name: 'Navy', value: '#12305c' },
  { name: 'Black', value: '#16181d' },
  { name: 'White', value: '#f7f7f4' },
  { name: 'Red', value: '#b3141b' },
  { name: 'Green', value: '#0f4d3a' },
  { name: 'Silver', value: '#b9bec6' },
  { name: 'Gold', value: '#c79a2b' },
  { name: 'Wood', value: '#7a4e2d' },
];

interface ModeDefaults {
  color: string;
  glow: string;
  font: string;
  boardStyle: Board['style'];
  night: boolean;
  background: string;
}

export const MODE_DEFAULTS: Record<Mode, ModeDefaults> = {
  'flat-board': { color: '#ffffff', glow: '#ffd76a', font: DEFAULT_FONT, boardStyle: 'solid', night: false, background: 'plaster' },
  '3d-letters': { color: '#d0202a', glow: '#ffd76a', font: DEFAULT_FONT, boardStyle: 'none', night: false, background: 'plaster' },
  led: { color: '#ffffff', glow: '#ffd76a', font: DEFAULT_FONT, boardStyle: 'none', night: true, background: 'shopfront-night' },
  neon: { color: '#ffffff', glow: '#ff2d95', font: DEFAULT_NEON_FONT, boardStyle: 'clear', night: true, background: 'brick' },
};

let counter = 0;
export function newId(): string {
  counter += 1;
  return `l${Date.now().toString(36)}${counter.toString(36)}`;
}

/** A font size that roughly fits `text` on the board (no canvas needed). */
export function fitFontSize(text: string, board: Board, maxHeightShare = 0.4, widthShare = 0.8): number {
  const rect = boardRect(board);
  const longest = Math.max(1, ...text.split('\n').map((line) => line.length));
  return Math.round(Math.min(rect.height * maxHeightShare, (rect.width * widthShare) / (longest * 0.5)));
}

/** Settings a text layer must have once it contains Urdu. */
export function urduAdjust(layer: TextLayer): TextLayer {
  if (!hasArabicScript(layer.text)) return layer;
  const font = getFont(layer.fontFamily);
  return {
    ...layer,
    fontFamily: font?.rtl ? layer.fontFamily : DEFAULT_URDU_FONT,
    charSpacing: 0,
    lineHeight: Math.max(layer.lineHeight, 2),
  };
}

export function makeText(design: Pick<Design, 'mode' | 'board'>, text: string, patch: Partial<TextLayer> = {}): TextLayer {
  const defaults = MODE_DEFAULTS[design.mode];
  const rect = boardRect(design.board);
  return urduAdjust({
    id: newId(),
    type: 'text',
    text,
    fontFamily: defaults.font,
    fontSize: fitFontSize(text, design.board),
    color: defaults.color,
    glow: defaults.glow,
    align: 'center',
    charSpacing: 0,
    lineHeight: 1.15,
    outlineColor: '#000000',
    outlineWidth: 0,
    x: rect.cx,
    y: rect.cy,
    angle: 0,
    ...patch,
  });
}

export function defaultDesign(mode: Mode): Design {
  const defaults = MODE_DEFAULTS[mode];
  const board: Board =
    mode === 'neon'
      ? { widthIn: 36, heightIn: 18, style: 'clear', shape: 'rounded', color: '#16181d', border: false }
      : { widthIn: 96, heightIn: 36, style: defaults.boardStyle, shape: 'rect', color: '#12305c', border: mode === 'flat-board' };
  const base = { mode, board };
  return {
    app: 'sign-designer',
    version: 1,
    mode,
    lighting: 'front-lit',
    lit: true,
    flicker: false,
    night: defaults.night,
    board,
    background: { kind: 'preset', id: defaults.background },
    layers: [makeText(base, mode === 'neon' ? 'Your Name' : 'YOUR SHOP NAME')],
  };
}

/** Switch mode, carrying the content over and swapping untouched defaults. */
export function applyMode(design: Design, mode: Mode): Design {
  if (mode === design.mode) return design;
  const from = MODE_DEFAULTS[design.mode];
  const to = MODE_DEFAULTS[mode];
  const style: Board['style'] = mode === 'flat-board' ? 'solid' : design.board.style === from.boardStyle ? to.boardStyle : design.board.style;
  return {
    ...design,
    mode,
    night: to.night,
    lit: true,
    board: { ...design.board, style, shape: design.board.shape === 'cut' && mode !== 'neon' ? 'rounded' : design.board.shape },
    background:
      design.background.kind === 'preset' && design.background.id === from.background
        ? { kind: 'preset', id: to.background }
        : design.background,
    layers: design.layers.map((layer) => {
      if (layer.type !== 'text') return layer;
      const urdu = hasArabicScript(layer.text);
      return {
        ...layer,
        color: layer.color === from.color ? to.color : layer.color,
        glow: layer.glow === from.glow ? to.glow : layer.glow,
        fontFamily: !urdu && layer.fontFamily === from.font ? to.font : layer.fontFamily,
      };
    }),
  };
}

/** Keep letters the same real-world size and place when the board size changes. */
export function resizeBoard(design: Design, widthIn: number, heightIn: number): Design {
  const before = boardRect(design.board);
  const board = { ...design.board, widthIn, heightIn };
  const after = boardRect(board);
  const k = after.pxPerInch / before.pxPerInch;
  return {
    ...design,
    board,
    layers: design.layers.map((layer) => {
      const moved = { x: after.cx + (layer.x - before.cx) * k, y: after.cy + (layer.y - before.cy) * k };
      return layer.type === 'text'
        ? { ...layer, ...moved, fontSize: Math.max(8, layer.fontSize * k), outlineWidth: layer.outlineWidth * k }
        : { ...layer, ...moved, scale: layer.scale * k };
    }),
  };
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Validates a loaded or stored design. Returns null if it is not usable. */
export function parseDesign(value: unknown): Design | null {
  const d = value as Design;
  if (!d || typeof d !== 'object' || d.app !== 'sign-designer' || d.version !== 1) return null;
  if (!MODES.some((m) => m.id === d.mode) || !d.board || !Array.isArray(d.layers)) return null;
  if (!isNum(d.board.widthIn) || !isNum(d.board.heightIn) || d.board.widthIn <= 0 || d.board.heightIn <= 0) return null;
  const layers = d.layers.filter((l): l is Layer => {
    if (!l || typeof l.id !== 'string' || !isNum(l.x) || !isNum(l.y)) return false;
    if (l.type === 'text') return typeof l.text === 'string' && isNum(l.fontSize) && typeof l.fontFamily === 'string';
    if (l.type === 'image') return typeof l.src === 'string' && l.src.startsWith('data:image/') && isNum(l.scale);
    return false;
  });
  const fallback = defaultDesign(d.mode);
  const background: Background =
    d.background?.kind === 'upload' && typeof d.background.src === 'string' && d.background.src.startsWith('data:image/')
      ? d.background
      : d.background?.kind === 'preset' && BACKGROUNDS.some((b) => b.id === (d.background as { id: string }).id)
        ? d.background
        : fallback.background;
  return {
    ...fallback,
    lighting: d.lighting === 'halo' ? 'halo' : 'front-lit',
    lit: d.lit !== false,
    flicker: d.flicker === true,
    night: d.night === true,
    board: { ...fallback.board, ...d.board },
    background,
    layers: layers.slice(0, MAX_LAYERS).map((l) =>
      l.type === 'text' ? { ...makeText(fallback, l.text), ...l } : { ...l, angle: isNum(l.angle) ? l.angle : 0, name: l.name ?? 'Logo' },
    ),
  };
}
