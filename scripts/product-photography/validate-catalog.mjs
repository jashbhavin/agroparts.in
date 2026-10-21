import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const root=process.cwd(),base='reports/product-image-audit',m=JSON.parse(await fs.readFile(base+'/catalog/manifest.json','utf8'));
if(m.summary?.textLockedPhotographs!==m.summary?.completed)throw Error('Text lock is not complete for every successful photograph.');
const failures=[],checked=[];let index=0;
const expected={square:[2048,2048],card:[1200,1200],landscape:[1536,1024],mobile:[768,768],thumbnail:[320,320]};
const hash=b=>createHash('sha256').update(b).digest('hex');
async function worker(){while(index<m.items.length){const item=m.items[index++];if(item.status==='failed'){failures.push({id:item.id,reason:item.error});continue;}
 try{
  const original=await fs.readFile(item.originalPath);if(hash(original)!==item.sourceHash)throw Error('Source original checksum changed');
  for(const t of item.technical){const file=path.resolve(root,item.outputs[t.kind]);const bytes=await fs.readFile(file);if(hash(bytes)!==t.sha256)throw Error('Output checksum mismatch: '+t.kind);const meta=await sharp(bytes).metadata();if(!meta.width||!meta.height)throw Error('Invalid image: '+t.kind);if(expected[t.kind]&&(meta.width!==expected[t.kind][0]||meta.height!==expected[t.kind][1]))throw Error('Unexpected dimensions: '+t.kind);const stats=await sharp(bytes).resize(48,48).stats();if(stats.channels.every(c=>c.stdev<1))throw Error('Blank/corrupt output: '+t.kind);checked.push({id:item.id,kind:t.kind,width:meta.width,height:meta.height,format:meta.format,bytes:bytes.length});}
  const maskFile=path.resolve(root,item.outputs.mask);const {data,info}=await sharp(maskFile).greyscale().raw().toBuffer({resolveWithObject:true});
  for(const region of item.textProtection.protectedRegions){const b=region.pixelBounds;for(let y=b.top;y<b.top+b.height;y++)for(let x=b.left;x<b.left+b.width;x++)if(data[y*info.width+x]!==255)throw Error('An original text region is not fully retained by the protected mask');}
  if(item.identity.opaqueForegroundPixelChanges!==0||item.identity.textRetyping!==false||item.identity.generatedPackagingText!==false)throw Error('Foreground/text preservation invariant failed');
 }catch(e){failures.push({id:item.id,reason:e.message});}
}}
await Promise.all(Array.from({length:3},()=>worker()));
const current=hash(await fs.readFile('lib/business.ts'));if(current!==m.websiteConfigHashBefore)failures.push({reason:'Website mappings/config changed'});
const result={checkedAt:new Date().toISOString(),photos:m.items.length,imagesChecked:checked.length,sourceOriginalsVerified:m.items.filter(i=>i.status!=='failed').length,protectedTextRegions:m.summary.protectedOriginalTextRegions,failures,passed:failures.length===0,wordingRetyped:false,productOrPackagingTextGenerated:false,websiteConfigUnchanged:current===m.websiteConfigHashBefore,notes:['Checks cover file validity, exact variants, content hashes, unchanged source hashes and fully opaque source text regions.','Original glyphs are retained, not OCR-transcribed. OCR may miss unreadable source text; native mask edges still require visual review.','This is not a claim that every mechanical edge has been independently engineering-verified.']};
await fs.writeFile(base+'/catalog-validation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(failures.length)process.exitCode=1;
