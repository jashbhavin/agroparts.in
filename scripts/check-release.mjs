import ts from 'typescript';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../lib/business.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const { business, assets, products, productionReady } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const issues = [];
for(const key of ['legalName','address','city','state','postalCode','phone','email','domain']) if(!business[key]) issues.push(`Confirm business.${key}`);
if(!business.ownerApproved) issues.push('Approve business identity, proposed copy, product names, image usage, and claims; then set ownerApproved=true');
if(!business.legalApproved) issues.push('Review policies, hosting provider, retention practices and effective dates; then set legalApproved=true');
if(!assets.hero || !assets.about || !assets.facilities.length) issues.push('Supply real business photographs');
if(!products.length) issues.push('Supply confirmed product information');
if(business.domain) {try {const u=new URL(business.domain);if(u.protocol!=='https:' || u.pathname!=='/' || u.search || u.hash || business.domain.endsWith('/')) issues.push('Use an HTTPS origin without a trailing slash for domain');}catch{issues.push('Domain must be a valid HTTPS URL');}}
if(issues.length || !productionReady) { console.error('Release is not ready:\n'+issues.map(i=>'• '+i).join('\n')); process.exitCode=1; } else console.log('Business-data release checks passed. Review the deployment checklist before publishing.');
