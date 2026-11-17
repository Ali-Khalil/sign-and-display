// Renders the home-page teaser picture from the real sign designer, so the
// preview always shows what the tool actually produces.
//   pnpm build:preview && node scripts/make-designer-preview.mjs
import { chromium } from 'playwright';
import sharp from 'sharp';
import { startPreview } from './lib/preview.mjs';

const server = await startPreview(4396);
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${server.url}/design-your-sign/?mode=led`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${server.url}/design-your-sign/?mode=led`);
  await page.locator('[data-sign-designer]').waitFor();
  await page.getByRole('textbox', { name: 'Text 1' }).fill('YOUR SHOP NAME');
  await page.getByRole('tab', { name: 'Style' }).click();
  await page.getByRole('button', { name: 'Halo-lit' }).click();
  await page.waitForTimeout(1200);
  const url = await page.evaluate(() => window.__signDesigner.scene.toPNG(2000));
  const png = Buffer.from(url.split(',')[1], 'base64');
  // Crop to the sign and a 16:10 frame.
  await sharp(png).extract({ left: 0, top: 80, width: 2000, height: 1250 }).jpeg({ quality: 84, mozjpeg: true }).toFile('src/assets/brand/designer-preview.jpg');
  console.log('wrote src/assets/brand/designer-preview.jpg');
} finally {
  await browser.close();
  server.stop();
}
