// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { site } from './src/config/site.ts';

// Until the owner supplies the real domain, builds fall back to SITE_URL
// (set on the host) or a neutral example.com so URLs stay valid.
const siteUrl = site.url.includes('{{')
  ? (process.env.SITE_URL ?? process.env.CF_PAGES_URL ?? 'https://example.com')
  : site.url;

// Pages that must never be in the sitemap.
const HIDDEN = ['/spike/', '/404'];
if (!site.features.ledFrames) HIDDEN.push('/led-frames/');

export default defineConfig({
  site: siteUrl,
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ur'],
    routing: { prefixDefaultLocale: false },
  },
  fonts: [
    {
      // {{BRAND}} display font. Body text uses the system font stack.
      provider: fontProviders.local(),
      name: 'Archivo',
      cssVariable: '--font-archivo',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/archivo-latin-wght-normal.woff2'], weight: '100 900', style: 'normal' },
        ],
      },
    },
  ],
  integrations: [
    preact(),
    sitemap({ filter: (page) => !HIDDEN.some((path) => page.includes(path)) }),
  ],
  vite: { plugins: [tailwindcss()] },
});
