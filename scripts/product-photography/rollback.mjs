import { promises as fs } from 'node:fs';
const file='reports/product-image-audit/pilot/integration-rollback.json';
const data=JSON.parse(await fs.readFile(file,'utf8'));
const current=await fs.readFile('lib/business.ts','utf8');
if(current!==data.after)throw Error('Business config changed since integration; refusing to overwrite unrelated work.');
if(!process.argv.includes('--apply')){console.log('Dry run: approved integration references would be restored. No files changed.');process.exit(0);}
await fs.writeFile('lib/business.ts.tmp',data.before);await fs.rename('lib/business.ts.tmp','lib/business.ts');
console.log('Previous image mappings restored. All original and generated assets retained. Rebuild to update local output.');
