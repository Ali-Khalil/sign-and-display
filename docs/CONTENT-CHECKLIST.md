# Content review checklist

Everything published on the site was written from general signage knowledge
and from facts already agreed. Before launch, the owner should read each page
and tick it off. Change anything that does not match how Sign & Display
really works.

## 1. Business details (`src/config/site.ts`)

Run `pnpm placeholders` to list what is missing.

- [ ] WhatsApp number (international format, e.g. `923001234567`)
- [ ] Phone number as it should be displayed
- [ ] Email address
- [ ] Street address and postal code
- [ ] Map coordinates (`geo`) and Google Business Profile link
- [ ] Opening hours (now `Mo-Sa 10:00-20:00`, unconfirmed)
- [ ] Social media links
- [ ] Urdu business name (optional)
- [ ] "Why us" points (the home-page section stays hidden until some are added)
- [x] Domain name (`url`): signanddisplay.pk

## 2. Signage type pages (`src/content/signage-types/`)

For each of the eight types, check:

- [ ] The type is one you actually make, and the name is the one customers use
- [ ] "Best for", materials and options match your work
- [ ] The lighting choices listed are ones you offer
- [ ] Every question and answer is true for your workshop
- [ ] Add your own figures where you want them: thicknesses, LED type,
      turnaround (`turnaround:`) and whether fitting is included
      (`installationIncluded:`)

Answers that are deliberately general and worth making specific:

- [ ] Outdoor suitability and how long signs last
- [ ] Delivery and fitting outside Jhang (now "confirmed on WhatsApp")
- [ ] Power use of LED signs
- [ ] Whether an old frame can be reused

## 3. Guides (`src/content/guides/`)

- [ ] 3D sign board price: has no figures on purpose. Add price ranges if you
      want them shown.
- [ ] Acrylic vs ACP vs foam board
- [ ] Front-lit vs backlit vs halo-lit
- [ ] LED neon flex vs glass neon
- [ ] Sign size: uses the common "1 inch of letter height per 10 feet" rule.
      Confirm it matches the advice you give.
- [ ] Preparing a logo: confirm the file types you accept

## 4. Other pages

- [ ] About (`src/content/pages/about.md`): add the real story, such as who
      runs the workshop, since when, the machines used, and workshop photos.
      None of that is on the page yet because it was not supplied.
- [ ] General FAQs (`src/content/faqs/`): nine are published. Add ones about
      payment and timing once decided.
- [ ] Jhang page: the three local questions (`jhang-*.md`) have general
      answers. Add specifics (visits, fitting, measuring) once decided.

## 5. Welcome kits (`src/content/services/welcome-kits.md`)

- [ ] The items listed (box, mug, water bottle, notepad, pencils) are the ones
      you offer; add or remove items as needed
- [ ] Add answers you can give once decided: minimum order quantity,
      whether each item can carry an employee's name, typical turnaround,
      and how the logo is applied (printing, engraving, etc.)
- [ ] Replace the drawn example kit picture with photos of real kits

## 6. Photos

- [ ] Portfolio: the seven projects are example designs made in the sign
      designer, marked `example: true` and badged "Example design". Add real
      jobs (day and night photos) under `src/content/portfolio/` and delete
      the examples once there are enough.
- [ ] Signage type pictures are "example designs" made in the sign designer.
      Replace them with real photos when you have them.
- [ ] Mark the best projects `featured: true` to show them in the home carousel.

## 7. Prices (skipped for now)

- [ ] Fill in `src/config/pricing.ts` when ready. "Starting from" prices and
      the estimate in the sign designer appear by themselves once it is filled.

## 8. Final check

- [ ] `pnpm check:launch` passes (it fails while any placeholder is left)
