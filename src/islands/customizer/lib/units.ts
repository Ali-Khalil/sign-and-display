/** Real-world size ↔ canvas units. */
export const CANVAS = { width: 1200, height: 900 };
const MAX_W = 1000;
const MAX_H = 600;

export interface BoardRect {
  left: number;
  top: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  pxPerInch: number;
}

/** Where the sign area sits on the canvas, and how many canvas units make an inch. */
export function boardRect(board: { widthIn: number; heightIn: number }): BoardRect {
  const pxPerInch = Math.min(MAX_W / board.widthIn, MAX_H / board.heightIn);
  const width = board.widthIn * pxPerInch;
  const height = board.heightIn * pxPerInch;
  const cx = CANVAS.width / 2;
  const cy = CANVAS.height / 2 - 30;
  return { left: cx - width / 2, top: cy - height / 2, width, height, cx, cy, pxPerInch };
}

/** 30 → "2 ft 6 in", 96 → "8 ft", 9.4 → "9.5 in" (nearest half inch). */
export function formatInches(inches: number): string {
  const rounded = Math.round(inches * 2) / 2;
  if (rounded < 12) return `${rounded} in`;
  const feet = Math.floor(rounded / 12);
  const rest = rounded - feet * 12;
  return rest === 0 ? `${feet} ft` : `${feet} ft ${rest} in`;
}

export function formatSize(widthIn: number, heightIn: number): string {
  return `${formatInches(widthIn)} × ${formatInches(heightIn)}`;
}

export const toFeetInches = (inches: number) => ({ feet: Math.floor(inches / 12), inches: Math.round((inches % 12) * 10) / 10 });
export const fromFeetInches = (feet: number, inches: number) => Math.max(0, feet) * 12 + Math.max(0, inches);
