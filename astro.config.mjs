// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { site } from './src/config/site.ts';

// Until the owner supplies the real domain, builds fall back to SITE_URL
// (set on Cloudflare Pages) or a neutral example.com so URLs stay valid.
const siteUrl = site.url.includes('{{')
  ? (process.env.SITE_URL ?? process.env.CF_PAGES_URL ?? 'https://example.com')
  : site.url;

export default defineConfig({
  site: siteUrl,
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ur'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    preact(),
    sitemap({
      // Internal test pages never go in the sitemap.
      filter: (page) => !page.includes('/spike/'),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
