import { test, expect } from '@playwright/test';
for(const viewport of [{width:1440,height:1000},{width:768,height:1024},{width:390,height:844},{width:320,height:740}]) {
 test(`homepage is usable at ${viewport.width}px`,async({page})=>{
  await page.setViewportSize(viewport);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toContainText('Modern Agriculture');
  for(const id of ['home','about','products','why-us','contact']) {await page.locator(`#${id}`).scrollIntoViewIfNeeded(); await expect(page.locator(`#${id}`)).toBeVisible();}
  await expect(page.locator('a[href="tel:+918976091112"]').first()).toBeVisible();
  await expect(page.locator('a[href="mailto:sales@agroparts.in"]').first()).toBeVisible();
  await page.evaluate(async()=>{await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));});
  expect(await page.locator('img').evaluateAll(images=>images.map(i=>i as HTMLImageElement).filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src))).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`test-results/home-${viewport.width}.png`,fullPage:true});
 });
}
test('mobile navigation opens, closes, and follows anchors',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const toggle=page.locator('#menu-toggle');await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await page.keyboard.press('Escape');await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.click();await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Products'}).click();
 await expect(page).toHaveURL(/#products$/);await expect(toggle).toHaveAttribute('aria-expanded','false');
});
test('legal routes and draft SEO are truthful',async({page,request})=>{
 for(const [path,title] of [['privacy-policy','Privacy Policy'],['terms-of-use','Terms of Use']]){await page.goto(`/${path}/`);await expect(page.getByRole('heading',{level:1,name:title})).toBeVisible();}
 await page.goto('/');await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
 expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
 expect((await request.get('/sitemap.xml')).ok()).toBe(true);
 await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
 await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
});

test('product collection expands and all studio images load on mobile and desktop', async ({ page }) => {
 for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await expect(page.locator('#infrastructure')).toHaveCount(0);
  await expect(page.locator('a[href="#infrastructure"]')).toHaveCount(0);
  await expect(page.locator('.product-card')).toHaveCount(6);
  const more = page.getByRole('button', { name: 'View More Products' });
  await more.click();
  await expect(page.locator('.product-card')).toHaveCount(12);
  await expect(page.getByRole('button', { name: 'View Fewer Products' })).toHaveAttribute('aria-expanded', 'true');
  for (const card of await page.locator('.product-card').all()) {
   await card.scrollIntoViewIfNeeded();
   await expect(card.locator('img')).toBeVisible();
   expect(await card.locator('img').evaluate(async (img: HTMLImageElement) => { await img.decode(); return img.naturalWidth > 0; })).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#products').screenshot({ path: `test-results/products-expanded-${width}.png` });
  await page.getByRole('button', { name: 'View Fewer Products' }).click();
  await expect(page.locator('.product-card')).toHaveCount(6);
 }
});
