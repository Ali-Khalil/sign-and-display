import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const URDU = 'مدینہ ٹریڈرز 0300-1234567';
const MODES = ['flat-board', '3d-letters', 'led', 'neon'] as const;

interface Layer {
  id: string;
  type: string;
  text: string;
  fontFamily: string;
  charSpacing: number;
  lineHeight: number;
  fontSize: number;
  x: number;
  y: number;
}
interface Design {
  mode: string;
  night: boolean;
  lit: boolean;
  lighting: string;
  board: { widthIn: number; heightIn: number; style: string };
  background: { kind: string; id?: string };
  layers: Layer[];
}

/** Opens the designer with empty storage. */
async function open(page: Page, mode?: string) {
  const url = mode ? `/design-your-sign/?mode=${mode}` : '/design-your-sign/';
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.goto(url);
  await page.locator('[data-sign-designer]').waitFor();
  // The designer publishes its state just after it first renders.
  await page.waitForFunction(() => 'getDesign' in ((window as unknown as { __signDesigner?: object }).__signDesigner ?? {}));
  // Keep WhatsApp links from leaving the page; record analytics events.
  await page.evaluate(() => {
    const w = window as unknown as { __events: unknown[] };
    w.__events = [];
    window.addEventListener('site:track', (e) => w.__events.push((e as CustomEvent).detail));
    document.addEventListener('click', (e) => {
      if ((e.target as Element).closest?.('a[href^="https://wa.me/"]')) e.preventDefault();
    });
  });
}

const design = (page: Page) =>
  page.evaluate(() => (window as unknown as { __signDesigner: { getDesign(): unknown } }).__signDesigner.getDesign()) as Promise<Design>;

/** How many different colours the rendered scene contains (a blank canvas has one). */
const colourCount = (page: Page) =>
  page.evaluate(() => {
    const { scene } = (window as unknown as { __signDesigner: { scene: { canvas: { toCanvasElement(m: number): HTMLCanvasElement } } } }).__signDesigner;
    const el = scene.canvas.toCanvasElement(0.5);
    const data = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data;
    const seen = new Set<number>();
    for (let i = 0; i < data.length; i += 16) seen.add((data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!);
    return seen.size;
  });

function pngSize(path: string) {
  const buf = readFileSync(path);
  expect(buf.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: buf.length };
}

for (const mode of MODES) {
  test(`${mode}: design with English and Urdu text, then export a PNG`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, mode);
    await expect(page.locator('[data-sign-designer]')).toHaveAttribute('data-sign-designer', mode);

    await page.getByRole('textbox', { name: 'Text 1' }).fill('Madina Traders');
    await page.getByRole('button', { name: '+ Add text' }).click();
    await page.getByRole('textbox', { name: 'Text 2' }).fill(URDU);

    const d = await design(page);
    expect(d.mode).toBe(mode);
    expect(d.layers.map((l) => l.text)).toEqual(['Madina Traders', URDU]);
    // Urdu text: Urdu font, no letter spacing, generous line height.
    expect(d.layers[1]!.fontFamily).toBe('Noto Nastaliq Urdu');
    expect(d.layers[1]!.charSpacing).toBe(0);
    expect(d.layers[1]!.lineHeight).toBeGreaterThanOrEqual(1.9);

    // The Urdu font really loads, and the canvas object is laid out right-to-left.
    await expect.poll(() => page.evaluate(() => document.fonts.check('32px "Noto Nastaliq Urdu"', 'مدینہ'))).toBe(true);
    const direction = await page.evaluate(() => {
      const { scene } = (window as unknown as { __signDesigner: { scene: { canvas: { getObjects(): { text?: string; resolvedDirection?: string }[] } } } }).__signDesigner;
      return scene.canvas.getObjects().find((o) => o.text?.includes('مدینہ'))?.resolvedDirection;
    });
    expect(direction).toBe('rtl');
    expect(await colourCount(page)).toBeGreaterThan(40);

    await page.getByRole('tab', { name: 'Export' }).click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PNG image' }).click()]);
    expect(download.suggestedFilename()).toBe('sign-design.png');
    const png = pngSize((await download.path())!);
    expect(png).toMatchObject({ width: 2400, height: 1800 });
    expect(png.bytes).toBeGreaterThan(20_000);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test('mode tabs switch the sign type and lighting controls follow', async ({ page }) => {
  await open(page);
  expect((await design(page)).mode).toBe('flat-board');
  await expect(page.getByRole('button', { name: 'Lights' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Neon', exact: true }).click();
  let d = await design(page);
  expect(d.mode).toBe('neon');
  expect(d.night).toBe(true);
  expect(page.url()).toContain('mode=neon');

  await page.getByRole('button', { name: 'Lights' }).click();
  expect((await design(page)).lit).toBe(false);

  await page.getByRole('button', { name: 'LED', exact: true }).click();
  await page.getByRole('tab', { name: 'Style' }).click();
  await page.getByRole('button', { name: 'Halo-lit' }).click();
  d = await design(page);
  expect(d.mode).toBe('led');
  expect(d.lighting).toBe('halo');
});

test('letter spacing is disabled for Urdu and fonts can be changed', async ({ page }) => {
  await open(page, '3d-letters');
  await page.getByRole('textbox', { name: 'Text 1' }).fill('Shop');
  await page.getByRole('tab', { name: 'Style' }).click();
  await expect(page.getByLabel('Letter spacing')).toBeEnabled();
  await page.getByRole('radio', { name: 'Bebas Neue' }).click();
  expect((await design(page)).layers[0]!.fontFamily).toBe('Bebas Neue');

  await page.getByRole('tab', { name: 'Text', exact: true }).click();
  await page.getByRole('textbox', { name: 'Text 1' }).fill('الحمد للہ جنرل اسٹور');
  await page.getByRole('tab', { name: 'Style' }).click();
  await expect(page.getByLabel('Letter spacing')).toBeDisabled();
  expect((await design(page)).layers[0]!.fontFamily).toBe('Noto Nastaliq Urdu');
  await page.getByRole('radio', { name: 'Gulzar' }).click();
  expect((await design(page)).layers[0]!.fontFamily).toBe('Gulzar');
});

test('undo and redo step through changes', async ({ page }) => {
  await open(page);
  await page.getByRole('textbox', { name: 'Text 1' }).fill('First');
  await page.waitForTimeout(700);
  await page.getByRole('textbox', { name: 'Text 1' }).fill('Second');
  await page.getByRole('button', { name: 'Undo' }).click();
  expect((await design(page)).layers[0]!.text).toBe('First');
  await page.getByRole('button', { name: 'Redo' }).click();
  expect((await design(page)).layers[0]!.text).toBe('Second');
});

test('the design is autosaved and restored after a reload', async ({ page }) => {
  await open(page, 'neon');
  await page.getByRole('textbox', { name: 'Text 1' }).fill('Chai Khana');
  await page.waitForTimeout(700);
  await page.goto('/design-your-sign/');
  await page.locator('[data-sign-designer="neon"]').waitFor();
  await expect(page.getByRole('textbox', { name: 'Text 1' })).toHaveValue('Chai Khana');
});

test('real-world size drives the readout', async ({ page }) => {
  await open(page);
  await page.getByRole('tab', { name: 'Board' }).click();
  await page.getByLabel('Width feet').fill('10');
  await page.getByLabel('Width feet').blur();
  await page.getByLabel('Height inches').fill('6');
  await page.getByLabel('Height inches').blur();
  const d = await design(page);
  expect(d.board).toMatchObject({ widthIn: 120, heightIn: 42 });
  await expect(page.locator('[data-readout]')).toContainText('10 ft × 3 ft 6 in');
  await expect(page.locator('[data-readout]')).toContainText(/letter height about [\d.]+ (in|ft)/);
});

test('templates, background presets, photo upload and logo upload', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Templates' }).click();
  await page.getByRole('button', { name: /Urdu \+ English shop board/ }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  let d = await design(page);
  expect(d.layers).toHaveLength(3);
  expect(d.layers[0]!.text).toBe('مدینہ ٹریڈرز');
  expect(d.layers[0]!.fontFamily).toBe('Noto Nastaliq Urdu');

  await page.getByRole('tab', { name: 'Background' }).click();
  await page.getByRole('radio', { name: 'Brick wall' }).click();
  expect((await design(page)).background).toEqual({ kind: 'preset', id: 'brick' });
  await page.getByRole('button', { name: 'Night', exact: true }).last().click();
  expect((await design(page)).night).toBe(true);

  // A tiny PNG stands in for a shopfront photo and a logo.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFElEQVR4nGP8z8Dwn4EIwDiqEAwAYd4D/dPLhkMAAAAASUVORK5CYII=', 'base64');
  await page.getByLabel(/shopfront photo/).setInputFiles({ name: 'shop.png', mimeType: 'image/png', buffer: png });
  await expect.poll(async () => (await design(page)).background.kind).toBe('upload');

  await page.getByRole('tab', { name: 'Text', exact: true }).click();
  await page.getByLabel('+ Add logo').setInputFiles({ name: 'my-logo.png', mimeType: 'image/png', buffer: png });
  await expect.poll(async () => (await design(page)).layers.length).toBe(4);
  d = await design(page);
  expect(d.layers[3]!.type).toBe('image');
  await expect(page.getByRole('button', { name: 'Remove my-logo' })).toBeVisible();
});

test('SVG export and design file save/load', async ({ page }) => {
  await open(page, '3d-letters');
  await page.getByRole('textbox', { name: 'Text 1' }).fill('Sign & Co');
  await page.getByRole('tab', { name: 'Export' }).click();

  const [svgDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Download SVG/ }).click()]);
  const svg = readFileSync((await svgDownload.path())!, 'utf8');
  expect(svg).toContain('<svg');
  expect(svg).toContain('font-family="Montserrat Black"');
  expect(svg).toContain('>Sign &amp; Co</text>');
  expect(svg).not.toContain('<image'); // no wall photo in the designer file

  const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save design' }).click()]);
  const path = (await jsonDownload.path())!;
  expect(JSON.parse(readFileSync(path, 'utf8'))).toMatchObject({ app: 'sign-designer', version: 1, mode: '3d-letters' });

  await page.getByRole('tab', { name: 'Text', exact: true }).click();
  await page.getByRole('textbox', { name: 'Text 1' }).fill('Changed');
  await page.getByRole('tab', { name: 'Export' }).click();
  await page.getByLabel('Load design').setInputFiles(path);
  await expect.poll(async () => (await design(page)).layers[0]!.text).toBe('Sign & Co');
});

test('Send on WhatsApp downloads the image and pre-fills the design details', async ({ page }) => {
  await open(page, 'neon');
  await page.getByRole('textbox', { name: 'Text 1' }).fill('Open late');
  await page.getByRole('tab', { name: 'Export' }).click();
  const link = page.getByRole('link', { name: 'Send on WhatsApp' }).last();

  const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
  expect(download.suggestedFilename()).toBe('sign-design.png');

  const text = new URL((await link.getAttribute('href'))!).searchParams.get('text')!;
  expect(text).toContain('Type: Neon');
  expect(text).toContain('Text: Open late');
  expect(text).toContain('Font: Tilt Neon');
  expect(text).toContain('Colours: Pink, clear acrylic backing');
  expect(text).toMatch(/Size: 3 ft × 1 ft 6 in \(letters approx\. [\d.]+ in\)/);
  expect(text).toContain('Lighting: LED neon');
  expect(text).toContain('I am attaching the downloaded design image.');
  expect(text).toContain('/design-your-sign/)');
  expect(text).not.toContain('Estimate'); // no prices are configured

  const events = await page.evaluate(() => (window as unknown as { __events: { event: string }[] }).__events.map((e) => e.event));
  expect(events).toContain('customizer_send_whatsapp');
  expect(events).toContain('whatsapp_click');
});

test('a layer can be selected and moved by touch or mouse on the canvas', async ({ page }, testInfo) => {
  await open(page);
  const box = (await page.locator('canvas.upper-canvas').boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height * (420 / 900); // the sign's centre
  const before = (await design(page)).layers[0]!;

  if (testInfo.project.name === 'mobile') {
    await page.touchscreen.tap(cx, cy);
  } else {
    await page.mouse.click(cx, cy);
  }
  const selected = () =>
    page.evaluate(() => {
      const { scene } = (window as unknown as { __signDesigner: { scene: { canvas: { getActiveObject(): { layerId?: string } | undefined } } } }).__signDesigner;
      return scene.canvas.getActiveObject()?.layerId ?? null;
    });
  expect(await selected()).toBe(before.id);

  // Keyboard nudge from the focused preview.
  await page.locator('[aria-label^="Sign preview"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  const after = (await design(page)).layers[0]!;
  expect(after.x).toBe(before.x + 4);
  expect(after.y).toBe(before.y + 4);

  if (testInfo.project.name !== 'mobile') {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy + 40, { steps: 6 });
    await page.mouse.up();
    const dragged = (await design(page)).layers[0]!;
    expect(dragged.x).toBeGreaterThan(after.x + 20);
  }
});
