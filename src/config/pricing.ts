/**
 * Indicative "starting from" rates in PKR, edited by the owner.
 *
 * Every value starts as `null`. The UI hides any price that is `null`, and
 * the customizer shows no estimate until the rates it needs are filled in.
 * Never put a guessed number here.
 */
export interface PriceRate {
  /** Starting price for the smallest typical job, in PKR. */
  startingFrom: number | null;
  /** Rate per square foot of board/backing, in PKR. */
  perSqFt: number | null;
  /** Rate per letter per inch of letter height, in PKR. */
  perLetterInch: number | null;
}

const empty: PriceRate = { startingFrom: null, perSqFt: null, perLetterInch: null };

export const pricing: Record<string, PriceRate> = {
  '3d-acrylic-letters': { ...empty },
  'led-backlit-signs': { ...empty },
  'neon-signs': { ...empty },
  'acp-aluminium-boards': { ...empty },
  'light-box-signs': { ...empty },
  'nameplates-office-signs': { ...empty },
  'reception-logo-signs': { ...empty },
  'foam-board-signs': { ...empty },
};

export function getRate(key: string | undefined): PriceRate | null {
  if (!key) return null;
  return pricing[key] ?? null;
}
