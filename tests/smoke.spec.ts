import { expect, test, type Page } from '@playwright/test';

const PAGES = [
  '/',
  '/signage/',
  '/signage/3d-acrylic-letters/',
  '/signage/neon-signs/',
  '/welcome-kits/',
  '/portfolio/',
  '/portfolio/example-shopfront-3d-letters/',
  '/guides/',
  '/guides/front-lit-vs-backlit-vs-halo-lit/',
  '/faq/',
  '/about/',
  '/contact/',
  '/signboards-in-jhang/',
  '/design-your-sign/',
];

/** Records analytics events and stops WhatsApp links from leaving the page. */
async function captureTracking(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __events: unknown[] };
    w.__events = [];
    window.addEventListener('site:track', (e) => w.__events.push((e as CustomEvent).detail));
    document.addEventListener('click', (e) => {
      if ((e.target as Element).closest?.('a[href^="https://wa.me/"]')) e.preventDefault();
    });
    window.open = () => null;
  });
}
const events = (page: Page) => page.evaluate(() => (window as unknown as { __events: { event: string; params: Record<string, string> }[] }).__events);

for (const path of PAGES) {
  test(`${path} renders with one h1, a pre-filled WhatsApp link and no overflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);

    const href = await page.locator('a[href^="https://wa.me/"]').first().getAttribute('href');
    const text = new URL(href!).searchParams.get('text')!;
    expect(text).toContain('Assalam o Alaikum');
    expect(text).toContain(`(From: `);
    expect(text).toContain(path === '/' ? '/)' : path);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'page must not scroll sideways').toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test('404 page links back to the main sections', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('h1')).toHaveText('Page not found');
  await expect(page.locator('main a[href="/signage/"]')).toBeVisible();
});

test('type page WhatsApp message names the sign type and fires whatsapp_click', async ({ page }) => {
  await captureTracking(page);
  await page.goto('/signage/neon-signs/');
  const cta = page.locator('main a[data-wa-location="type-hero"]');
  const text = new URL((await cta.getAttribute('href'))!).searchParams.get('text')!;
  expect(text).toContain("I'm interested in Neon Signs (LED Neon Flex).");
  expect(text).toContain('Text/Name: \nSize (approx): \nCity: ');
  await cta.click();
  expect(await events(page)).toContainEqual({ event: 'whatsapp_click', params: { location: 'type-hero', type: 'neon-signs' } });
});

test('floating WhatsApp button is on content pages', async ({ page }) => {
  await page.goto('/about/');
  const fab = page.locator('a[data-wa-location="floating-button"]');
  await expect(fab).toBeVisible();
  await expect(fab).toHaveAccessibleName('Chat on WhatsApp');
});

test('portfolio filter shows only the chosen type', async ({ page }) => {
  await page.goto('/portfolio/');
  const cards = page.locator('[data-project]');
  const total = await cards.count();
  await page.getByRole('button', { name: 'Neon Signs (LED Neon Flex)' }).click();
  await expect(page.locator('[data-project]:visible')).toHaveCount(2);
  await expect(page.locator('#portfolio-count')).toHaveText('2 projects');
  for (const card of await page.locator('[data-project]:visible').all()) {
    expect(await card.getAttribute('data-types')).toContain('neon-signs');
  }
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('[data-project]:visible')).toHaveCount(total);
});

test('portfolio shows every project without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/portfolio/');
  await expect(page.locator('[data-project]:visible')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'All', exact: true })).toBeHidden();
  await context.close();
});

test('project lightbox opens and closes', async ({ page }) => {
  await page.goto('/portfolio/example-shopfront-3d-letters/');
  await page.locator('a[data-lightbox]').first().click();
  const dialog = page.locator('dialog#lightbox');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveAttribute('alt', /Example design/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('contact form builds a WhatsApp message', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __opened: string[] };
    w.__opened = [];
    window.open = (url) => (w.__opened.push(String(url)), null);
  });
  await page.goto('/contact/');
  await page.getByLabel('Your name').fill('Ali');
  await page.getByLabel('Type of sign').selectOption({ label: 'Light Box Signs' });
  await page.getByLabel('Text or name on the sign').fill('مدینہ ٹریڈرز');
  await page.getByLabel('Approximate size').fill('8 ft x 3 ft');
  await page.getByLabel('City').fill('Chiniot');
  await page.getByRole('button', { name: 'Open WhatsApp with this message' }).click();
  const [url] = await page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);
  const text = new URL(url!).searchParams.get('text')!;
  expect(url).toMatch(/^https:\/\/wa\.me\//);
  expect(text).toContain('Type of sign: Light Box Signs');
  expect(text).toContain('Text/Name: مدینہ ٹریڈرز');
  expect(text).toContain('City: Chiniot');
  expect(text).toContain('/contact/)');
});

test('mobile menu opens and lists the main sections', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile only');
  await page.goto('/');
  const menu = page.locator('nav[aria-label="Mobile"]');
  await expect(menu).toBeHidden();
  await page.locator('header summary').tap();
  await expect(menu.getByRole('link', { name: 'Portfolio' })).toBeVisible();
  await expect(menu.locator('a[data-wa-location="mobile-menu"]')).toBeVisible();
});

test('robots.txt, llms.txt and sitemap are served', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: ');
  expect(robots).toContain('User-agent: GPTBot');
  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toContain('## Signage types');
  expect(robots).toContain('/sitemap.xml');
  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBe(true);
  const sitemap = await response.text();
  expect(sitemap).toContain('<urlset');
  expect(sitemap).toContain('/signage/3d-acrylic-letters/');
  expect(sitemap).not.toContain('/spike/');
  expect(sitemap).toContain('/design-your-sign/');
});

test('hero carousel steps through the logo and recent work', async ({ page }) => {
  await page.goto('/');
  const carousel = page.locator('[data-carousel]');
  await expect(carousel.locator('[data-track] > div')).toHaveCount(7);
  await page.getByRole('button', { name: 'Pause' }).click(); // stop auto-advance for a steady test
  await expect(carousel.locator('[data-dot="0"]')).toHaveAttribute('aria-current', 'true');
  await page.getByRole('button', { name: 'Next slide' }).click();
  await expect(carousel.locator('[data-dot="1"]')).toHaveAttribute('aria-current', 'true');
  await expect(carousel.locator('[data-track] > div').nth(1).locator('a')).toBeInViewport();
  await page.getByRole('button', { name: 'Previous slide' }).click();
  await expect(carousel.locator('[data-dot="0"]')).toHaveAttribute('aria-current', 'true');
});

test('welcome kits page asks for the kit details on WhatsApp', async ({ page }) => {
  await page.goto('/welcome-kits/');
  await expect(page.locator('h1')).toHaveText('Branded Welcome Kits');
  await expect(page.getByRole('heading', { name: 'What goes in the box?', exact: true })).toBeVisible();
  const href = await page.locator('main a[data-wa-location="service-hero"]').getAttribute('href');
  const text = new URL(href!).searchParams.get('text')!;
  expect(text).toContain("I'm interested in branded welcome kits.");
  expect(text).toContain('Number of kits: ');
  expect(text).toContain('City: ');
  expect(text).toContain('/welcome-kits/)');
  await page.goto('/');
  await expect(page.getByRole('link', { name: /About welcome kits/ })).toBeVisible();
});
