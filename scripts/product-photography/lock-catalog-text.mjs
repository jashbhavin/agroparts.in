import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { protectText } from './protect-text.mjs';
import { composePreserved } from './compose-preserved.mjs';
const root=process.cwd(),file='reports/product-image-audit/catalog/manifest.json';
const manifest=JSON.parse(await fs.readFile(file,'utf8'));
if(!manifest.summary)throw Error('Wait for native catalog processing to finish before text-lock finalization.');
const revision=createHash('sha256').update(await fs.readFile('scripts/product-photography/protect-text.mjs')).digest('hex');
let index=0,done=0,queue=Promise.resolve();const concurrency=Math.min(3,Math.max(1,Number(process.env.PHOTO_CONCURRENCY||2)));
async function save(){const snapshot=JSON.stringify(manifest,null,2);queue=queue.then(async()=>{await fs.writeFile(file+'.tmp',snapshot);await fs.rename(file+'.tmp',file);});await queue;}
async function work(){while(index<manifest.items.length){const i=manifest.items[index++];if(i.status==='failed'){done++;continue;}if(i.textProtectionRevision===revision){done++;continue;}
 try{
  const directory=path.dirname(path.resolve(root,i.outputs.square)),base=path.join(directory,'foreground');
  const protectedMasks=await protectText(base);
  const square=path.resolve(root,i.outputs.square),qa=await composePreserved(protectedMasks.prefix,square);
  const master=path.resolve(root,i.outputs.master),dimensions=await sharp(master).metadata();const nativeQA=await composePreserved(protectedMasks.prefix,master,{width:dimensions.width,height:dimensions.height});
  const landscapeTemp=path.join(directory,'text-locked-landscape.png');const landscapeQA=await composePreserved(protectedMasks.prefix,landscapeTemp,{width:1536,height:1024});await sharp(landscapeTemp).webp({quality:90}).toFile(path.resolve(root,i.outputs.landscape));await fs.unlink(landscapeTemp);
  for(const [kind,width] of [['card',1200],['mobile',768],['thumbnail',320]])await sharp(square).resize(width,width).webp({quality:kind==='card'?90:88}).toFile(path.resolve(root,i.outputs[kind]));
  i.textProtection=protectedMasks.report;i.textProtectionRevision=revision;i.websiteFitQualityCheck=qa;i.landscapeFitQualityCheck=landscapeQA;i.nativeFitQualityCheck=nativeQA;i.outputs.mask=path.relative(root,protectedMasks.prefix+'-mask.png');
  i.identity.opaqueForegroundPixelChanges=qa.instances.reduce((n,c)=>n+c.alteredOpaquePixels,0);i.identity.textRetyping=false;i.identity.generatedPackagingText=false;
  i.status=qa.warnings.length?'review-required':'candidate-ready-for-review';
  for(const t of i.technical){const bytes=await fs.readFile(path.resolve(root,i.outputs[t.kind]));const m=await sharp(bytes).metadata();t.bytes=bytes.length;t.width=m.width;t.height=m.height;t.sha256=createHash('sha256').update(bytes).digest('hex');}
  await fs.writeFile(path.join(directory,'review.json'),JSON.stringify(i,null,2));
 }catch(e){i.status='review-required';i.textProtectionError=e.message;}
 done++;await save();console.log(`Text lock ${done}/${manifest.items.length}: ${i.originalFilename}`);
}}
await Promise.all(Array.from({length:concurrency},()=>work()));await queue;
manifest.summary={...manifest.summary,completed:manifest.items.filter(i=>i.status!=='failed').length,failed:manifest.items.filter(i=>i.status==='failed').length,fitOrMaskReviewRequired:manifest.items.filter(i=>i.status==='review-required').length,candidatesReadyForReview:manifest.items.filter(i=>i.status==='candidate-ready-for-review').length,textLockedPhotographs:manifest.items.filter(i=>i.textProtectionRevision===revision).length,protectedOriginalTextRegions:manifest.items.reduce((n,i)=>n+(i.textProtection?.protectedRegions.length||0),0),textLockErrors:manifest.items.filter(i=>i.textProtectionError).length,alteredOpaqueForegroundPixels:manifest.items.reduce((n,i)=>n+(i.identity?.opaqueForegroundPixelChanges||0),0),wordingRetyped:false,generatedProductOrPackagingText:false};
manifest.updatedAt=new Date().toISOString();await save();console.log(JSON.stringify(manifest.summary,null,2));
