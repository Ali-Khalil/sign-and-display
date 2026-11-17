import { getRate } from '../../../config/pricing';
import type { Design, Mode } from './design';

const PRICE_KEY: Record<Mode, string> = {
  'flat-board': 'acp-aluminium-boards',
  '3d-letters': '3d-acrylic-letters',
  led: 'led-backlit-signs',
  neon: 'neon-signs',
};

/**
 * Indicative estimate in PKR, or null when the owner has not filled in the
 * rates this design needs. Never guesses.
 */
export function estimatePrice(design: Design, letterHeightIn: number | null): number | null {
  const rate = getRate(PRICE_KEY[design.mode]);
  if (!rate) return null;

  const areaSqFt = (design.board.widthIn * design.board.heightIn) / 144;
  const letters = design.layers.reduce((n, l) => n + (l.type === 'text' ? l.text.replace(/\s/g, '').length : 0), 0);
  const needsBoard = design.board.style !== 'none';
  const needsLetters = design.mode !== 'flat-board';

  let total = 0;
  if (needsBoard) {
    if (rate.perSqFt === null) return null;
    total += areaSqFt * rate.perSqFt;
  }
  if (needsLetters) {
    if (rate.perLetterInch === null || letterHeightIn === null) return null;
    total += letters * letterHeightIn * rate.perLetterInch;
  }
  if (rate.startingFrom !== null) total = Math.max(total, rate.startingFrom);
  return total > 0 ? Math.round(total / 100) * 100 : null;
}
