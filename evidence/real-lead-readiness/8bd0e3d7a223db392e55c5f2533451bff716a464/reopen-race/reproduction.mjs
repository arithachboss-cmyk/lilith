import { chromium, expect } from '@playwright/test';
import { syntheticPng } from '../../tests/helpers/synthetic-image.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const out='output/playwright/reopen-race'; mkdirSync(out,{recursive:true});
const records=[];
const log=(caseName,kind,details={})=>{const row={at:new Date().toISOString(),case:caseName,kind,...details};records.push(row);console.log(JSON.stringify(row));};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 for(const mode of ['reopen-before-image-snapshot','stale-reopen-after-save']) {
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4199',viewport:{width:390,height:844},hasTouch:true});
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  const page=await context.newPage();const paused=deferred(),release=deferred(),reopenPaused=deferred(),reopenRelease=deferred();
  let holdEvents=true,staleArm=false,puts=0;
  page.on('request',request=>{if(request.method()==='PUT'&&request.url().includes('/api/pilot/images/'))puts++;});
  page.on('response',response=>{const request=response.request(),path=new URL(response.url()).pathname;if(path.startsWith('/api/pilot/'))log(mode,'http',{method:request.method(),path,status:response.status()});});
  const identity=await context.request.get('/api/pilot/build');log(mode,'identity',await identity.json());
  await page.route('**/api/pilot/events',async route=>{if(holdEvents){holdEvents=false;paused.resolve();await release.promise;}await route.continue();});
  await page.route('**/api/pilot/draft',async route=>{
   if(mode==='stale-reopen-after-save'&&staleArm&&route.request().method()==='GET'){
    staleArm=false;const response=await route.fetch();const body=await response.json();log(mode,'held-reopen-snapshot',{images:body.data.images.length,lead:body.data.lead?.id??null});reopenPaused.resolve();await reopenRelease.promise;await route.fulfill({response});
   }else await route.continue();
  });
  await page.goto('/pilot?lang=en&utm_source=test_reopen_race&utm_medium=direct&utm_campaign=internal_qa');
  await page.addStyleTag({content:'html{font-size:200% !important}'});
  await page.getByRole('button',{name:'Fill synthetic test details'}).click();
  await page.getByLabel('Test images',{exact:true}).setInputFiles(Array.from({length:4},(_,i)=>({name:`synthetic-${i}.png`,mimeType:'image/png',buffer:syntheticPng(i)})));
  await expect(page.getByText('4 / 4 images',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Review consent/}).click();await page.getByRole('checkbox').check();
  log(mode,'before-save',{gallery:await page.locator('.pilot-gallery').count(),previewCount:4});
  await page.screenshot({path:`${out}/${mode}-before.png`,fullPage:true});
  await page.getByRole('button',{name:/Save test request/}).click();await paused.promise;
  log(mode,'save-paused',{reopenEnabled:await page.getByRole('button',{name:'Reopen saved request'}).isEnabled(),puts});
  if(mode==='stale-reopen-after-save')staleArm=true;
  await page.getByRole('button',{name:'Reopen saved request'}).click();
  if(mode==='stale-reopen-after-save')await reopenPaused.promise;
  else {await expect(page.locator('.pilot-gallery')).toHaveCount(0);log(mode,'reopen-cleared-preview',{gallery:await page.locator('.pilot-gallery').count(),puts});}
  release.resolve();await expect(page.getByTestId('lead-id')).toBeVisible();const id=await page.getByTestId('lead-id').innerText();
  if(mode==='stale-reopen-after-save'){
   await expect(page.getByText('4 / 4 images',{exact:true})).toBeVisible();log(mode,'saved-before-stale-response',{lead_id:id,puts,gallery:4});reopenRelease.resolve();await expect(page.locator('.pilot-gallery')).toHaveCount(0);
  }
  const token=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('middle-property-mock-session-v1')).token);
  const response=await context.request.get('/api/pilot/draft',{headers:{'x-pilot-token':token}});const draft=(await response.json()).data;
  log(mode,'result',{lead_id:id,puts,persisted_images:draft.images.length,persisted_lead:draft.lead?.id,rendered_gallery_sections:await page.locator('.pilot-gallery').count()});
  await page.screenshot({path:`${out}/${mode}-after.png`,fullPage:true});
  await page.reload();await expect(page.getByTestId('lead-id')).toHaveText(id);log(mode,'after-reload',{lead_id:id,gallery:await page.locator('.pilot-gallery').count(),image_text:await page.locator('.pilot-gallery > p').allTextContents()});
  await context.close();
 }
}finally{await browser.close();writeFileSync(`${out}/reproduction.json`,JSON.stringify(records,null,2)+'\n');}
