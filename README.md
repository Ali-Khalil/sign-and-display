# Signage website

Static website for a signboard workshop in Jhang, Punjab: signage types,
portfolio, a browser-based sign customizer with Urdu support, and WhatsApp
enquiries. Built with Astro, Tailwind CSS v4, Preact and Fabric.js.

Status: **Phase 1** (content site) is built on sample content. The sign
customizer is Phase 2; `/design-your-sign/` is a stand-in page until then.
The Urdu rendering spike from Phase 0 is in
[`docs/spike/REPORT.md`](docs/spike/REPORT.md).

## Commands

```bash
pnpm install
pnpm dev             # http://localhost:4321, sample content shown
pnpm build           # production build: sample content left out
pnpm build:preview   # build WITH sample content, for reviewing layouts
pnpm preview         # serve dist/
pnpm check           # type check
pnpm check:dist      # SEO, WhatsApp and JSON-LD checks on dist/
pnpm test            # Playwright smoke tests (run build:preview first)
pnpm lighthouse      # Lighthouse targets (run build:preview first)
pnpm placeholders    # list business facts still to be supplied
pnpm check:launch    # production build that fails on any placeholder
```

Tests and Lighthouse need Chromium: run `pnpm exec playwright install chromium`
once, or point `PLAYWRIGHT_CHROMIUM_PATH` and `CHROME_PATH` at an existing one.

## Where to edit things

| What | File |
|---|---|
| Business name, phone, WhatsApp, address, hours, "why us" points, feature flags | `src/config/site.ts` |
| "Starting from" prices (leave `null` to hide) | `src/config/pricing.ts` |
| Analytics tokens | `src/config/analytics.ts` |
| Menu links | `src/config/nav.ts` |
| Brand colours and site fonts | `src/styles/global.css` (`@theme`) and `fonts` in `astro.config.mjs` |
| Customizer fonts | `src/config/fonts.ts`, then `node scripts/sync-fonts.mjs` |

Values written as `{{PLACEHOLDER}}` have not been supplied yet. Nothing on the
site may be invented: no prices, reviews, client names or years in business
unless the owner provides them.

## Editing content

Content lives in `src/content/` as Markdown files. The file name is the URL:
`signage-types/neon-signs.md` becomes `/signage/neon-signs/`.

| Folder | Becomes |
|---|---|
| `signage-types/` | `/signage/[type]/` pages, the home grid and the comparison table |
| `portfolio/` | `/portfolio/` and project pages |
| `faqs/` | General questions on `/faq/` and the home page (`home: true`) |
| `guides/` | `/guides/` articles |
| `pages/about.md` | The story section of `/about/` |

**Everything there now is sample content**, marked `draft: true`. Drafts show
in `pnpm dev` and `pnpm build:preview` (with a yellow banner and `noindex`)
and are left out of `pnpm build`. To publish an entry: replace the sample
facts with real ones, replace the sample image, and set `draft: false`.

Rules of thumb:

- `summary` on a signage type is the first paragraph on its page: 40–60 words
  that say what the sign is and who it is for.
- `shortDescription` is at most 160 characters; `seo.title` 60; `seo.description` 155.
- Put project photos in `src/assets/` and reference them with a relative
  path. The first image of a project is its cover. Always write `alt` text.
- Only add `client` to a project with the client's permission.

The images in `src/assets/samples/` are generated illustrations
(`node scripts/make-sample-images.mjs`), labelled as samples. They are not
photos of real work.

## Deploy

Any static host works. Build command `pnpm build`, output directory `dist`,
Node 22. Until the real domain is in `site.ts`, set the `SITE_URL` environment
variable to the site's address so canonical URLs and the sitemap are right.

## Photo guide for the owner

Shoot every job by day **and** by night, straight-on plus at an angle, with a
close-up of the edges and finish. Landscape photos, at least 2000px wide.

## Fonts

All fonts are self-hosted and under the SIL Open Font License; licence texts
are in `public/fonts/licenses/`.
