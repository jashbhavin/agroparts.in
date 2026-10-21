import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
const root=process.cwd(),base=path.join(root,'reports/product-image-audit/pilot');
const dry=!process.argv.includes('--apply');
const decisions=JSON.parse(await fs.readFile(path.join(base,'decisions.json'),'utf8'));
const manifest=JSON.parse(await fs.readFile(path.join(base,'manifest.json'),'utf8'));
const configFile=path.join(root,'lib/business.ts');const original=await fs.readFile(configFile,'utf8');let updated=original;
const plan=[];
const current={'gear-assembly':'/images/products/gear-assembly-square.webp','clutch-components':'/images/products/clutch-components-square.webp','recoil-starters':'/images/products/recoil-starters-square.webp'};
for(const choice of decisions){
 if(!choice.approved)continue;
 const candidate=manifest.images.find(i=>i.id===choice.id);if(!candidate)throw Error('Unknown product id');
 if(!choice.identityChecked||!choice.brandingChecked||!choice.websiteFitChecked||!choice.ownerApprovalEvidence)throw Error('Incomplete human approval checks: '+choice.id);
 if(choice.variant==='ai'&&candidate.review.status==='rejected')throw Error('Rejected AI outputs cannot be integrated; repair and independently review a new attempt.');
 if(choice.variant!=='conservative')throw Error('No approved variant selected');
 const source=path.resolve(root,candidate.conservative.square.file);
 const bytes=await fs.readFile(source),hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
 const target=`/images/products/${choice.id}-photographic-${hash}.webp`;
 if(!original.includes(current[choice.id]))throw Error('Website mapping changed; review the plan instead of overwriting unrelated work.');
 updated=updated.replace(current[choice.id],target);plan.push({id:choice.id,source,target});
}
console.log(JSON.stringify({dryRun:dry,approvedSelections:plan.length,plan,websiteWillChange:!dry&&plan.length>0},null,2));
if(dry||!plan.length)process.exit(0);
const rollbackFile=path.join(base,'integration-rollback.json');try{await fs.access(rollbackFile);throw Error('Integration already recorded. Review rollback or create a new run.');}catch(e){if(e.code!=='ENOENT')throw e;}
for(const item of plan){const file=path.join(root,'public',item.target);await fs.copyFile(item.source,file);for(const width of [64,128,256,480,768,1200,1600])await sharp(file).resize({width,withoutEnlargement:true}).webp({quality:88}).toFile(file.replace('.webp',`-${width}.webp`));}
await fs.writeFile(rollbackFile,JSON.stringify({before:original,after:updated,plan,createdAt:new Date().toISOString()},null,2));
await fs.writeFile(configFile+'.tmp',updated);await fs.rename(configFile+'.tmp',configFile);
console.log('Approved photographic variants integrated. Run build and browser checks before any deployment.');
