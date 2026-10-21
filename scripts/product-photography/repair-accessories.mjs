import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import sharp from 'sharp';
const exec=promisify(execFile),file='reports/product-image-audit/catalog/manifest.json',m=JSON.parse(await fs.readFile(file,'utf8'));
const recipes={};
for(let n=5667;n<=5671;n++)recipes['IMG_'+n]={mode:'merge',regions:[[.25,.56,.75,.32]],reason:'Restore the separately visible black hose and its metal clips, omitted by the global foreground mask.'};
for(let n=5680;n<=5685;n++)recipes['IMG_'+n]={mode:'add',regions:[[.27,.60,.42,.22]],reason:'Restore the real horizontal gear shaft in front of the displayed packets.'};
for(const n of [5734,5735])recipes['IMG_'+n]={mode:'add',regions:[[.28,.74,.46,.25],[.29,.78,.11,.12]],reason:'Restore the fuel cap, transparent filter and small white nozzle in front of the two tanks.'};
recipes.IMG_5754={mode:'keep-identification-card',compositionPreset:'r-pin-card',regions:[[.15,.45,.70,.45],[.09,.77,.25,.13]],reason:'Retain the photographed identification card and restore the actual small branded box, attached R-pin and loose R-pins. Exclude the unrelated partial rear box.'};
recipes.IMG_5755={mode:'add',regions:[[.25,.47,.55,.43]],reason:'Retain the original identification card and restore the actual small branded box and two photographed shaft pins.'};
recipes.IMG_5782={mode:'add',regions:[[.18,.48,.82,.34]],reason:'Restore the two actual silver dust-cover rings omitted by the initial global mask.'};
const version=createHash('sha256').update(JSON.stringify(recipes)).digest('hex');let count=0;
for(const entry of m.items){const key=path.parse(entry.originalFilename).name.toUpperCase(),recipe=recipes[key];if(!recipe)continue;if(entry.accessoryRepairVersion===version)continue;
 const dir=path.dirname(entry.outputs.square),prefix=path.join(dir,'foreground'),originalMeta=prefix+'-before-accessory-repair.json';
 try{await fs.access(originalMeta);}catch{await fs.copyFile(prefix+'-mask.json',originalMeta);}
 const meta=JSON.parse(await fs.readFile(originalMeta,'utf8'));const width=meta.width,height=meta.height;
 let masks=[];for(const instance of meta.instanceMasks){if(recipe.mode==='keep-identification-card'&&instance.id===1)continue;const data=await sharp(instance.mask).greyscale().raw().toBuffer();masks.push({id:instance.id,data:Buffer.from(data)});}
 const restoredRegions=[];
 for(let r=0;r<recipe.regions.length;r++){
  const a=recipe.regions[r],crop={left:Math.floor(width*a[0]),top:Math.floor(height*a[1]),width:Math.floor(width*a[2]),height:Math.floor(height*a[3])};
  const region=path.join(dir,'accessory-region-'+r);await sharp(meta.source).extract(crop).png().toFile(region+'.png');
  await exec('/tmp/agro-foreground',[region+'.png',region],{maxBuffer:4*1024*1024,timeout:120000});
  const small=await sharp(region+'-mask.png').greyscale().raw().toBuffer();const full=Buffer.alloc(width*height);
  for(let y=0;y<crop.height;y++)for(let x=0;x<crop.width;x++)full[(crop.top+y)*width+crop.left+x]=small[y*crop.width+x];
  masks.push({id:100+r,data:full});restoredRegions.push({crop,mask:region+'-mask.png',source:region+'.png',method:'Native foreground inference on a focused original-source crop; no new product pixels or label text.'});
 }
 if(recipe.mode==='merge'){const union=Buffer.alloc(width*height);for(const part of masks)for(let p=0;p<union.length;p++)union[p]=Math.max(union[p],part.data[p]);masks=[{id:1,data:union}];}
 const combined=Buffer.alloc(width*height),instanceMasks=[];
 for(const part of masks){const name=prefix+'-restored-instance-'+part.id+'.png';await sharp(part.data,{raw:{width,height,channels:1}}).png().toFile(name);instanceMasks.push({id:part.id,mask:name});for(let p=0;p<combined.length;p++)combined[p]=Math.max(combined[p],part.data[p]);}
 const combinedFile=prefix+'-restored-mask.png';await sharp(combined,{raw:{width,height,channels:1}}).png().toFile(combinedFile);
 await fs.writeFile(prefix+'-mask.json',JSON.stringify({...meta,instanceMasks,mask:combinedFile,...(recipe.compositionPreset?{compositionOverride:{preset:recipe.compositionPreset}}:{}),accessoryRecovery:{reason:recipe.reason,regions:restoredRegions,sourcePixelsOnly:true}},null,2));
 entry.accessoryRepairVersion=version;entry.accessoryRecovery={reason:recipe.reason,regions:restoredRegions,manuallyFlaggedForFinalInspection:true};entry.textProtectionRevision=null;entry.status='review-required';
 count++;await fs.writeFile(file+'.tmp',JSON.stringify(m,null,2));await fs.rename(file+'.tmp',file);console.log('Recovered source accessories: '+entry.originalFilename);
}
m.summary.accessoryMasksRepaired=m.items.filter(i=>i.accessoryRecovery).length;await fs.writeFile(file+'.tmp',JSON.stringify(m,null,2));await fs.rename(file+'.tmp',file);console.log({repairsPerformed:count,totalRepairRecords:m.summary.accessoryMasksRepaired});
