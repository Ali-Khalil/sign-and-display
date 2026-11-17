// Runs the Urdu/RTL spike page in Chromium and saves screenshots + metrics
// to docs/spike/. Usage: pnpm build && pnpm spike:rtl
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { startPreview } from '../../scripts/lib/preview.mjs';

const OUT = 'docs/spike';
mkdirSync(OUT, { recursive: true });

const server = await startPreview(4399);
try {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 2080, height: 1200 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${server.url}/spike/rtl/`);
  await page.waitForFunction(() => window.__spike?.done, null, { timeout: 60_000 });
  const spike = await page.evaluate(() => window.__spike);
  if (spike.error) throw new Error(spike.error);

  for (const { family } of spike.results) {
    const slug = family.toLowerCase().replace(/\s+/g, '-');
    await page.locator(`#ref-${slug}`).screenshot({ path: `${OUT}/${slug}-1-html-reference.png` });
    await page.locator(`#native-${slug}`).screenshot({ path: `${OUT}/${slug}-2-fabric-native.png` });
    await page.locator(`#shaped-${slug}`).screenshot({ path: `${OUT}/${slug}-3-shapedtext.png` });
  }
  await page.locator('#handles-wrap').screenshot({ path: `${OUT}/selection-handles.png` });
  writeFileSync(`${OUT}/metrics.json`, JSON.stringify(spike.results, null, 2) + '\n');
  console.log(`Saved screenshots and metrics for ${spike.results.length} fonts to ${OUT}/`);
  if (errors.length) console.error('Page errors:', errors);
  await browser.close();
} finally {
  server.stop();
}
