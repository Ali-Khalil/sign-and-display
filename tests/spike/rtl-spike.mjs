// Runs the Urdu/RTL spike page in Chromium and saves screenshots + metrics
// to docs/spike/. Usage: pnpm build && pnpm spike:rtl
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 4399;
const OUT = 'docs/spike';
mkdirSync(OUT, { recursive: true });

const server = spawn('pnpm', ['exec', 'astro', 'preview', '--port', String(PORT)], { stdio: 'ignore' });
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2080, height: 1200 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  for (let i = 0; ; i++) {
    try {
      await page.goto(`http://localhost:${PORT}/spike/rtl/`);
      break;
    } catch (e) {
      if (i > 40) throw e;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
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
  console.log(JSON.stringify(spike.results, null, 1));
  if (errors.length) console.error('Page errors:', errors);
  await browser.close();
} finally {
  server.kill();
}
