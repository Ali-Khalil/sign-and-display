/**
 * Single source of truth for business facts.
 *
 * Every `{{PLACEHOLDER}}` (and the X-ed out phone numbers, zero geo
 * coordinates and empty strings) must be supplied by the owner. Nothing here
 * may be invented. Run `pnpm placeholders` to list what is still unfilled.
 */
export interface SiteConfig {
  name: string;
  nameUrdu: string;
  tagline: string;
  url: string;
  /** International format, no + or spaces, e.g. 923001234567. */
  whatsapp: string;
  phoneDisplay: string;
  email: string;
  address: { street: string; city: string; region: string; postalCode: string; country: string };
  geo: { lat: number; lng: number };
  /** schema.org format, e.g. 'Mo-Sa 10:00-20:00'. */
  openingHours: string[];
  serviceAreas: string[];
  social: { facebook: string; instagram: string; tiktok: string; youtube: string };
  googleBusinessProfileUrl: string;
  /** "Why us" points. Only add points that are true; the section is hidden while empty. */
  whyUs: { title: string; text: string }[];
  features: { ledFrames: boolean; designUpload: boolean; ga4: boolean };
  /** AI crawlers named in robots.txt. Set allowAiCrawlers to false to block them. */
  allowAiCrawlers: boolean;
  aiCrawlers: string[];
}

export const site: SiteConfig = {
  name: '{{BUSINESS_NAME}}',
  nameUrdu: '{{BUSINESS_NAME_URDU}}',
  tagline: '{{TAGLINE}}',
  url: 'https://{{DOMAIN}}',
  whatsapp: '92XXXXXXXXXX',
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
  whyUs: [],
  features: { ledFrames: false, designUpload: false, ga4: false },
  allowAiCrawlers: true,
  aiCrawlers: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot'],
};

/** True for values the owner has not filled in yet. */
export function isPlaceholder(value: string): boolean {
  return value === '' || value.includes('{{') || /X{4,}/.test(value);
}

export const hasGeo = site.geo.lat !== 0 || site.geo.lng !== 0;
