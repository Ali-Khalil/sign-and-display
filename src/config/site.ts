/**
 * Single source of truth for business facts.
 *
 * Every `{{PLACEHOLDER}}` (and the X-ed out phone numbers, zero geo
 * coordinates and empty strings) must be supplied by the owner. Nothing here
 * may be invented. `isPlaceholder()` lets the UI and tests detect unfilled
 * values.
 */
export const site = {
  name: '{{BUSINESS_NAME}}',
  nameUrdu: '{{BUSINESS_NAME_URDU}}',
  tagline: '{{TAGLINE}}',
  url: 'https://{{DOMAIN}}',
  whatsapp: '92XXXXXXXXXX', // international format, no + or spaces
  phoneDisplay: '0300-XXXXXXX',
  email: '{{EMAIL}}',
  address: {
    street: '{{STREET}}',
    city: 'Jhang',
    region: 'Punjab',
    postalCode: '{{POSTAL_CODE}}',
    country: 'PK',
  },
  geo: { lat: 0, lng: 0 }, // owner to supply
  openingHours: ['Mo-Sa 10:00-20:00'], // owner to confirm
  serviceAreas: ['Jhang', 'Faisalabad', 'Chiniot', 'Sargodha', 'Toba Tek Singh'],
  social: { facebook: '', instagram: '', tiktok: '', youtube: '' },
  googleBusinessProfileUrl: '',
  features: { ledFrames: false, designUpload: false, ga4: false },
} as const;

export type Site = typeof site;

/** True for values the owner has not filled in yet. */
export function isPlaceholder(value: string): boolean {
  return value === '' || value.includes('{{') || /X{4,}/.test(value);
}
