# Phase 0: Urdu / RTL Fabric.js spike

**Result: use the `ShapedText` fallback for every sign text layer.** Fabric's
native text joins Urdu letters correctly, but its box does not fit the text.

Reproduce with `pnpm build && pnpm spike:rtl` (page: `/spike/rtl/`). Tested in
Chromium 1.63 Playwright build, Fabric.js 7.4.0, font size 26px.

## What was tested

Five strings × three Urdu fonts (Noto Nastaliq Urdu, Gulzar, Lalezar) × five
effects (flat, 3D extrude, front-lit, halo-lit, neon), drawn three ways:

1. plain HTML `<p dir="rtl">` — the reference
2. Fabric native `FabricText` (`direction: 'rtl'`, `charSpacing: 0`)
3. `ShapedText` (`src/islands/customizer/canvas/ShapedText.ts`)

## Findings

| Check | Fabric native | ShapedText |
|---|---|---|
| Letters join, ligatures render | Yes | Yes |
| Word / mixed-script order matches HTML | Yes | Yes |
| Box width matches the shaped text | No: 0.89–1.11 × the real width | Yes |
| Box height covers the ink (Nastaliq) | No: up to 20px of ink above and 7px below the box at 26px | Yes |
| Selection handles fit the text | No (see `selection-handles.png`) | Yes |
| Glow survives object caching | No: halo/neon glow is cut at the box edge | Yes (drawn uncached) |
| JSON save → load → identical render | n/a | Yes |
| Phone number order in Urdu text | Wrong | Fixed |

Why native fails: Fabric measures text character by character and sizes the
box from `fontSize`, so it never sees the shaped width or Nastaliq's tall
ascenders and deep descenders. Lalezar (a flat Arabic display face) is nearly
fine natively; both Nastaliq fonts are not.

### Phone numbers reverse in Urdu text (browser behaviour, not a Fabric bug)

`مدینہ ٹریڈرز 0300-1234567` renders as `1234567-0300` in plain HTML as well:
after an Arabic letter the Unicode bidi algorithm lays the two digit groups
out right to left. `ShapedText` wraps number runs in invisible left-to-right
isolate marks at draw time (`isolateNumbers` in `lib/rtl.ts`), so the number
reads `0300-1234567`. The same fix is needed for any Urdu text on the content
site that contains a phone number.

## Screenshots

Per font: `*-1-html-reference.png`, `*-2-fabric-native.png`,
`*-3-shapedtext.png`. Columns are flat · extrude · front-lit · halo · neon;
green dashes are the object's bounding box. The sixth reference row is the
phone string with number isolation. Raw numbers: `metrics.json`.

## Carried into Phase 2

- `ShapedText` has no SVG export yet (`toSVG`); needed for "Download SVG".
- It is drawn uncached so glows are not clipped. Fine for a handful of text
  layers; revisit if the canvas feels slow on a mid-range phone.
- Its box follows the ink, so the box height changes slightly as the text
  changes. Objects are centre-anchored, so the text does not jump.
- Not verified on a real Android device yet.
