import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import sharp from 'sharp';
import { composePreserved } from './compose-preserved.mjs';
const exec=promisify(execFile),root=process.cwd(),base=path.join(root,'reports/product-image-audit');
const out=path.join(base,'catalog');await fs.mkdir(out,{recursive:true});
const inventory=JSON.parse(await fs.readFile(path.join(base,'inventory.json'),'utf8'));
const eligible=inventory.sourceFiles.filter(i=>i.classification==='source product photograph');
const limitArg=process.argv.find(a=>a.startsWith('--limit='));const selected=limitArg?eligible.slice(0,Number(limitArg.slice(8))):eligible;
const dry=process.argv.includes('--dry-run'),force=process.argv.includes('--force'),concurrency=Math.min(3,Math.max(1,Number(process.env.PHOTO_CONCURRENCY||2)));
const authorization={styleApproved:true,fullLibraryApproved:true,source:'User approved AI studio direction and selected Full product library in this conversation.',criticalConstraint:'No wording changed on packaging or anywhere else. Therefore do not generatively reconstruct the photographed products or labels.',websiteImageApproval:'Still separate from style/batch authorization; keep output in local review until image checks pass.'};
if(dry){console.log(JSON.stringify({dryRun:true,eligible:selected.length,concurrency,method:'Native foreground masks + original photographic RGB + AI studio backdrop',paidAPI:false,websiteReplacement:false,deployment:false},null,2));process.exit(0);}
const sha=b=>createHash('sha256').update(b).digest('hex');
const configHash=sha(await fs.readFile('lib/business.ts'));
const processorHash=sha(Buffer.concat([await fs.readFile('scripts/product-photography/compose-preserved.mjs'),await fs.readFile('scripts/product-photography/native/foreground.swift'),await fs.readFile('assets/studio-backgrounds/neutral-studio-v1.png')]));
const manifestFile=path.join(out,'manifest.json');let previous={items:[]};try{previous=JSON.parse(await fs.readFile(manifestFile,'utf8'));}catch{}
const items=[];let index=0,completed=0,saveQueue=Promise.resolve();
const state=()=>({updatedAt:new Date().toISOString(),authorization,concurrency,processorHash,websiteConfigHashBefore:configHash,items:structuredClone(items).sort((a,b)=>a.originalFilename.localeCompare(b.originalFilename))});
async function save(){const snapshot=state();saveQueue=saveQueue.then(async()=>{await fs.writeFile(manifestFile+'.tmp',JSON.stringify(snapshot,null,2));await fs.rename(manifestFile+'.tmp',manifestFile);});await saveQueue;}
async function runWithRetry(fn){for(let attempt=0;;attempt++){try{return await fn();}catch(e){if(attempt>=2)throw e;await new Promise(r=>setTimeout(r,500*2**attempt));}}}
async function processPhoto(photo){
 const id=path.parse(photo.filename).name.toLowerCase()+'-'+photo.sha256.slice(0,10),dir=path.join(out,id),prefix=path.join(dir,'foreground');
 const old=previous.items.find(i=>i.id===id&&i.sourceHash===photo.sha256&&i.processorHash===processorHash&&i.status!=='failed');
 if(!force&&old&&await fs.stat(path.join(root,old.outputs.card)).catch(()=>false))return {...old,resumed:true};
 await fs.mkdir(dir,{recursive:true});const started=Date.now();
 try{
  const original=path.join(root,photo.backup);if(sha(await fs.readFile(original))!==photo.sha256)throw Error('Original backup checksum mismatch');
  if(force||!await fs.stat(prefix+'-mask.json').catch(()=>false))await runWithRetry(()=>exec('/tmp/agro-foreground',[original,prefix],{maxBuffer:8*1024*1024,timeout:180000}));
  const meta=JSON.parse(await fs.readFile(prefix+'-mask.json','utf8'));
  const square=path.join(dir,'studio-square-master.png');const qa=await composePreserved(prefix,square);
  const landscape=path.join(dir,'studio-landscape.webp');const landscapeTemp=path.join(dir,'landscape-source.png');const landscapeQA=await composePreserved(prefix,landscapeTemp,{width:1536,height:1024});await sharp(landscapeTemp).webp({quality:90}).toFile(landscape);await fs.unlink(landscapeTemp);
  const {data,info}=await sharp(meta.mask).greyscale().raw().toBuffer({resolveWithObject:true});let left=info.width,top=info.height,right=0,bottom=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[y*info.width+x]>128){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const ratio=(right-left+1)/(bottom-top+1);let masterW,masterH;if(ratio>=1){masterW=2400;masterH=Math.max(600,Math.round(masterW/ratio));}else{masterH=2400;masterW=Math.max(600,Math.round(masterH*ratio));}
  const master=path.join(dir,'studio-native-master.png');const nativeQA=await composePreserved(prefix,master,{width:masterW,height:masterH});
  const card=path.join(dir,'studio-card.webp'),thumb=path.join(dir,'studio-thumbnail.webp'),mobile=path.join(dir,'studio-mobile.webp');
  await sharp(square).resize(1200,1200).webp({quality:90}).toFile(card);await sharp(square).resize(768,768).webp({quality:88}).toFile(mobile);await sharp(square).resize(320,320).webp({quality:88}).toFile(thumb);
  const files={master,square,card,landscape,mobile,thumbnail:thumb,source:meta.source,mask:meta.mask};const outputs=Object.fromEntries(Object.entries(files).map(([k,v])=>[k,path.relative(root,v)]));
  const technical=[];for(const [kind,file] of Object.entries(files)){if(['source','mask'].includes(kind))continue;const bytes=await fs.readFile(file),m=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();if(stats.channels.every(c=>c.stdev<1))throw Error('Blank output: '+kind);technical.push({kind,width:m.width,height:m.height,format:m.format,bytes:bytes.length,sha256:sha(bytes)});}
  const originalSourceUnchanged=sha(await fs.readFile(photo.path))===photo.sha256;if(!originalSourceUnchanged)throw Error('Source original changed');
  const entry={id,originalFilename:photo.filename,originalPath:photo.path,sourceHash:photo.sha256,processorHash,status:qa.warnings.length?'review-required':'candidate-ready-for-review',sourceOriginalUnchanged:true,outputs,technical,websiteFitQualityCheck:qa,landscapeFitQualityCheck:landscapeQA,nativeFitQualityCheck:nativeQA,originalReadOnlyText:meta.originalTextReadOnly,identity:{method:'Original photographed foreground RGB copied; AI never generates product, packaging, logo or text.',opaqueForegroundPixelChanges:qa.instances.reduce((n,i)=>n+i.alteredOpaquePixels,0),caveat:'Mask accuracy and source visibility still require visual review; copying pixels does not prove mask completeness.'},durationMs:Date.now()-started,humanApproved:false,websiteEligible:false};
  await fs.writeFile(path.join(dir,'review.json'),JSON.stringify(entry,null,2));return entry;
 }catch(e){return {id,originalFilename:photo.filename,sourceHash:photo.sha256,processorHash,status:'failed',error:e.message,durationMs:Date.now()-started,websiteEligible:false};}
}
async function worker(){while(index<selected.length){const photo=selected[index++];const result=await processPhoto(photo);items.push(result);completed++;await save();console.log(`${completed}/${selected.length} ${result.originalFilename}: ${result.status}${result.resumed?' (resumed)':''}`);}}
await Promise.all(Array.from({length:concurrency},()=>worker()));await saveQueue;
const result=state();result.websiteConfigHashAfter=sha(await fs.readFile('lib/business.ts'));result.websiteConfigUnchanged=result.websiteConfigHashAfter===configHash;
result.summary={requested:selected.length,completed:items.filter(i=>i.status!=='failed').length,failed:items.filter(i=>i.status==='failed').length,fitOrMaskReviewRequired:items.filter(i=>i.status==='review-required').length,candidatesReadyForReview:items.filter(i=>i.status==='candidate-ready-for-review').length,sourceOriginalsVerified:items.filter(i=>i.sourceOriginalUnchanged).length,alteredOpaqueForegroundPixels:items.reduce((n,i)=>n+(i.identity?.opaqueForegroundPixelChanges||0),0),imageVariants:items.reduce((n,i)=>n+(i.technical?.length||0),0),websiteConfigUnchanged:result.websiteConfigUnchanged,allRequireHumanApproval:true};
await fs.writeFile(manifestFile+'.tmp',JSON.stringify(result,null,2));await fs.rename(manifestFile+'.tmp',manifestFile);console.log(JSON.stringify(result.summary,null,2));
if(!result.websiteConfigUnchanged)process.exitCode=1;
