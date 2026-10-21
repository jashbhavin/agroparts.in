import type { MetadataRoute } from 'next';
import { business, productionReady } from '@/lib/business';
export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots { return {rules:{userAgent:'*',...(productionReady ? {allow:'/'} : {disallow:'/'})},...(business.domain && productionReady ? {sitemap:`${business.domain}/sitemap.xml`} : {})}; }
