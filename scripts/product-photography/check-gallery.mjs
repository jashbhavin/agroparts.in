import { chromium } from '@playwright/test';
import { promises as fs } from 'node:fs';
const base='reports/product-image-audit',m=JSON.parse(await fs.readFile(base+'/catalog/manifest.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage(),checks=[];
try{
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:3121/catalog.html');
  await page.locator('img').evaluateAll(async images=>{for(const im of images)im.loading='eager';await Promise.all(images.map(im=>im.decode()));});
  const count=await page.locator('.card').count(),broken=await page.locator('img').evaluateAll(images=>images.filter(im=>!im.complete||!im.naturalWidth).length),overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if(count!==m.summary.completed||broken||overflow)throw Error('Catalog gallery check failed at '+width);
  checks.push({width,cards:count,brokenImages:broken,horizontalOverflow:overflow});
  if(width===1440)await page.screenshot({path:base+'/catalog-preview-desktop.png'});
  if(width===390)await page.locator('.card').first().screenshot({path:base+'/catalog-preview-mobile.png'});
 }
 await page.locator('#search').fill('IMG_5637');const matches=await page.locator('.card:not([hidden])').count();if(matches!==1)throw Error('Filename search failed');
 await page.locator('#search').fill('');await page.locator('#review').check();const flagged=await page.locator('.card:not([hidden])').count();if(flagged!==m.summary.fitOrMaskReviewRequired)throw Error('Review filter failed');
 await fs.writeFile(base+'/catalog-gallery-qa.json',JSON.stringify({passed:true,checkedAt:new Date().toISOString(),checks,filenameSearchMatches:matches,reviewFilterMatches:flagged},null,2));console.log({passed:true,checks,reviewFilterMatches:flagged});
}finally{await browser.close();}
