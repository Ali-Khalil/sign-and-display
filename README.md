# Sign & Display website

Static website for Sign & Display, a signboard workshop in Jhang, Punjab: signage types,
portfolio, a browser-based sign customizer with Urdu support, and WhatsApp
enquiries. Built with Astro, Tailwind CSS v4, Preact and Fabric.js.

Status: **Phase 3**. The content site, the sign designer and the SEO content
(type pages, FAQ, About, six guides, per-page social images) are built. The
portfolio still holds example designs only, and several business details are
placeholders: see [`docs/CONTENT-CHECKLIST.md`](docs/CONTENT-CHECKLIST.md).

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
| Social-share images | Drawn at build time by `src/lib/og.ts`, one per page |
| Menu links | `src/config/nav.ts` |
| Brand colours and site fonts | `src/styles/global.css` (`@theme`) and `fonts` in `astro.config.mjs` |
| Logo image, hero picture | `src/assets/brand/` (the wordmark in the header is `src/components/ui/Logo.astro`). After replacing `logo-sign.webp`, run `node scripts/make-logo-cutout.mjs` to remake the transparent version used in the hero |
| Hero slides | The logo, then up to six portfolio projects marked `featured: true` |
| Sign designer fonts | `src/config/fonts.ts`, then `node scripts/sync-fonts.mjs` |
| Sign designer templates | `src/islands/customizer/templates/index.ts` |
| Sign designer colours, wall scenes, mode defaults | `src/islands/customizer/lib/design.ts` |

Values written as `{{PLACEHOLDER}}` have not been supplied yet. Nothing on the
site may be invented: no prices, reviews, client names or years in business
unless the owner provides them.

## Editing content

Content lives in `src/content/` as Markdown files. The file name is the URL:
`signage-types/neon-signs.md` becomes `/signage/neon-signs/`.

| Folder | Becomes |
|---|---|
| `signage-types/` | `/signage/[type]/` pages, the home grid and the comparison table |
| `services/` | Pages for services that are not signs, at `/<file-name>/` (now: `welcome-kits`) |
| `portfolio/` | `/portfolio/` and project pages |
| `faqs/` | General questions on `/faq/` and the home page (`home: true`) |
| `guides/` | `/guides/` articles |
| `pages/about.md` | The story section of `/about/` |

Everything in these folders is published. An entry can be hidden with
`draft: true`: drafts show in `pnpm dev` and `pnpm build:preview` and are left
out of `pnpm build`.

The portfolio currently holds example designs made with the sign designer,
marked `example: true`. They show an "Example design" badge and no city, size
or date. Replace them with real jobs as photos come in.

Rules of thumb:

- `summary` on a signage type is the first paragraph on its page: 40–60 words
  that say what the sign is and who it is for.
- `shortDescription` is at most 160 characters; `seo.title` 60; `seo.description` 155.
- Put project photos in `src/assets/` and reference them with a relative
  path. The first image of a project is its cover. Always write `alt` text.
- Only add `client` to a project with the client's permission.

The images in `src/assets/samples/` are rendered by the site's own sign
designer (`node scripts/make-sample-images.mjs`, after `pnpm build:preview`)
and tagged "example design". They are not photos of real work.

Photos by other people (currently the wall textures in the sign designer) are
openly licensed. Each one is listed in `src/config/credits.ts`, which feeds the
`/credits/` page; add an entry there whenever such a photo is added.

## The sign designer

`/design-your-sign/` is a Preact island (`src/islands/customizer/`) that loads
Fabric.js on that page only. Four modes: flat board, 3D letters, LED
(front-lit or halo-lit) and neon. `?mode=led` in the URL opens a mode directly.

- **3D letters** are drawn with shaded sides, a trim edge and a wall shadow.
  The Style tab sets the depth, which side the letters show, and the side
  colour. Boards can be matte, gloss or glitter.
- **Text is typed in the side panel, never on the canvas.** All sign text is
  drawn by `canvas/ShapedText.ts`, which lets the browser shape each line, so
  Urdu letters join correctly and phone numbers keep their order.
- **Urdu is detected automatically:** the layer switches to an Urdu font,
  letter spacing is turned off and line height is raised. The large Nastaliq
  fonts are downloaded only when Urdu is typed.
- **Nothing is uploaded.** Logos and shopfront photos stay in the browser.
  The design autosaves to the browser's local storage.
- **Real size:** the width and height entered on the Board tab set the scale,
  and the letter height shown is worked out from it.
- **Price estimate:** hidden until the rates in `src/config/pricing.ts` are
  filled in.
- **Send on WhatsApp** downloads the PNG and opens WhatsApp with the details
  filled in; the customer attaches the image. (A direct image link comes with
  the upload Worker in Phase 4.)
- **Design files:** "Save design" writes a `.json` file that "Load design"
  reopens exactly, so the workshop can open a customer's design.
- **Wall scenes** are openly licensed photos (CC0 / CC BY), processed by
  `node scripts/make-backgrounds.mjs --photos`. Replace the files in
  `public/customizer/backgrounds/` with your own wall photos if preferred.
- **Light box:** in flat-board mode the Board tab can make the board glow at
  night, for light box signs.
- **Home-page teaser:** `node scripts/make-designer-preview.mjs` (after
  `pnpm build:preview`) re-renders it from the designer itself.

Known limits: the SVG export keeps text as text (fonts must be installed) and
leaves out glow effects; "cut to shape" neon backing is drawn as a rounded
outline around the lettering.

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
