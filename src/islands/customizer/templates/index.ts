/**
 * Starter templates. The names and numbers in them are sample text for the
 * customer to replace, not real businesses.
 */
import { defaultDesign, fitFontSize, makeText, type Board, type Design, type Mode } from '../lib/design';
import { DEFAULT_FONT, DEFAULT_NEON_FONT } from '../../../config/fonts';
import { boardRect } from '../lib/units';

export interface Template {
  id: string;
  name: string;
  description: string;
  build(): Design;
}

function base(mode: Mode, board: Partial<Board>, patch: Partial<Design> = {}): Design {
  const design = defaultDesign(mode);
  return { ...design, ...patch, board: { ...design.board, ...board }, layers: [] };
}

/** Place a line of text at a vertical position given as a share of the board height. */
function line(design: Design, text: string, at: number, heightShare: number, patch: Parameters<typeof makeText>[2] = {}) {
  const rect = boardRect(design.board);
  const font = patch.fontFamily ?? (design.mode === 'neon' ? DEFAULT_NEON_FONT : DEFAULT_FONT);
  const fontSize = fitFontSize(text, design.board, font, heightShare, 0.82);
  return makeText(design, text, { y: rect.top + rect.height * at, fontSize, ...patch });
}

export const TEMPLATES: Template[] = [
  {
    id: 'shop-name-phone',
    name: 'Shop name + phone',
    description: 'Flat board with an aluminium border',
    build() {
      const d = base('flat-board', { widthIn: 120, heightIn: 36, color: '#12305c', border: true, finish: 'gloss' });
      d.layers = [
        line(d, 'YOUR SHOP NAME', 0.4, 0.4),
        line(d, 'Mobile: 0300-1234567', 0.78, 0.16, { fontFamily: 'Oswald', color: '#f5b301' }),
      ];
      return d;
    },
  },
  {
    id: 'bilingual-shop',
    name: 'Urdu + English shop board',
    description: 'Urdu name on top, English and phone below',
    build() {
      const d = base('flat-board', { widthIn: 120, heightIn: 48, color: '#0f4d3a', border: true, finish: 'glitter' });
      d.layers = [
        line(d, 'مدینہ ٹریڈرز', 0.3, 0.24, { color: '#ffffff' }),
        line(d, 'MADINA TRADERS', 0.66, 0.17, { color: '#f5b301' }),
        line(d, '0300-1234567', 0.87, 0.1, { fontFamily: 'Oswald' }),
      ];
      return d;
    },
  },
  {
    id: 'clinic',
    name: 'Clinic',
    description: 'White light box with green lettering',
    build() {
      const d = base('flat-board', { widthIn: 72, heightIn: 30, color: '#f7f7f4', shape: 'rounded', border: false, backlit: true }, { night: true, background: { kind: 'preset', id: 'dark-wall' } });
      d.layers = [
        line(d, 'YOUR CLINIC', 0.4, 0.36, { color: '#0f7a4d', fontFamily: 'Archivo Black' }),
        line(d, 'Dr. Name · Timings 5pm to 9pm', 0.78, 0.13, { color: '#16181d', fontFamily: 'Oswald' }),
      ];
      return d;
    },
  },
  {
    id: 'office-nameplate',
    name: 'Office nameplate',
    description: 'Small silver plate for a door or desk',
    build() {
      const d = base('flat-board', { widthIn: 12, heightIn: 4, color: '#b9bec6', shape: 'rounded', border: false }, { background: { kind: 'preset', id: 'office' } });
      d.layers = [
        line(d, 'Your Name', 0.4, 0.34, { color: '#16181d', fontFamily: 'Oswald' }),
        line(d, 'Designation', 0.77, 0.17, { color: '#16181d', fontFamily: 'Oswald' }),
      ];
      return d;
    },
  },
  {
    id: 'led-letters',
    name: 'LED shop letters',
    description: 'Front-lit 3D letters on a shopfront at night',
    build() {
      const d = base('led', { widthIn: 120, heightIn: 30 });
      d.layers = [line(d, 'YOUR BRAND', 0.5, 0.62, { color: '#ffffff', glow: '#ffd76a' })];
      return d;
    },
  },
  {
    id: 'cafe-neon',
    name: 'Café neon',
    description: 'Pink neon script on a clear backing',
    build() {
      const d = base('neon', { widthIn: 36, heightIn: 18, style: 'clear', shape: 'cut' });
      d.layers = [line(d, 'Open late', 0.5, 0.5, { fontFamily: 'Neonderthaw', glow: '#ff2d95' })];
      return d;
    },
  },
];
