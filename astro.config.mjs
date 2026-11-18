// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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
      // Display font, chosen to match the heavy letters of "SIGN" in the logo.
      provider: fontProviders.local(),
      name: 'Montserrat',
      cssVariable: '--font-montserrat',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [{ src: ['./src/assets/fonts/montserrat-latin-wght-normal.woff2'], weight: '100 900', style: 'normal' }],
      },
    },
    {
      // Wide technical face, close to "DISPLAY" in the logo. Used for the wordmark and small labels.
      provider: fontProviders.local(),
      name: 'Michroma',
      cssVariable: '--font-michroma',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [{ src: ['./src/assets/fonts/michroma-latin-400-normal.woff2'], weight: 400, style: 'normal' }],
      },
    },
  ],
  integrations: [
    preact(),
    sitemap({ filter: (page) => !HIDDEN.some((path) => page.includes(path)) }),
    {
      // Also publish the sitemap at /sitemap.xml, the address Google Search
      // Console and most tools expect. With one sitemap file (up to 45,000
      // pages) that file is the full page list; beyond that it is the index.
      name: 'sitemap-xml',
      hooks: {
        'astro:build:done': ({ dir }) => {
          const out = fileURLToPath(dir);
          const single = !existsSync(`${out}/sitemap-1.xml`);
          copyFileSync(`${out}/${single ? 'sitemap-0.xml' : 'sitemap-index.xml'}`, `${out}/sitemap.xml`);
        },
      },
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
