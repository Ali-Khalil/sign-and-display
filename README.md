# Signage website

Static website for a signboard workshop in Jhang, Punjab: signage types,
portfolio, a browser-based sign customizer with Urdu support, and WhatsApp
enquiries. Built with Astro, Tailwind CSS v4, Preact and Fabric.js.

Status: **Phase 0** (scaffold + Urdu/RTL spike). See
[`docs/spike/REPORT.md`](docs/spike/REPORT.md).

## Setup

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # static site in dist/
pnpm check      # type check
pnpm spike:rtl  # after a build: re-run the Urdu rendering spike
```

## Where to edit things

| What | File |
|---|---|
| Business name, phone, WhatsApp, address, hours, feature flags | `src/config/site.ts` |
| "Starting from" prices (leave `null` to hide) | `src/config/pricing.ts` |
| Analytics tokens | `src/config/analytics.ts` |
| Customizer fonts | `src/config/fonts.ts`, then `node scripts/sync-fonts.mjs` |
| Brand colours and site fonts | `src/styles/global.css` (`@theme`) |

Values written as `{{PLACEHOLDER}}` have not been supplied yet. Nothing on the
site may be invented: no prices, reviews, client names or years in business
unless the owner provides them.

## Deploy (Cloudflare Pages)

Connect this repository in the Cloudflare dashboard (Workers & Pages → Create
→ Pages → Connect to Git) with:

- Build command: `pnpm build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION=22`
- Until the real domain is in `site.ts`, set `SITE_URL` to the Pages URL

## Photo guide for the owner

Shoot every job by day **and** by night, straight-on plus at an angle, with a
close-up of the edges and finish. Landscape photos, at least 2000px wide.

## Fonts

All fonts are self-hosted and under the SIL Open Font License; licence texts
are in `public/fonts/licenses/`.
