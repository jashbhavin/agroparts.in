import type { MetadataRoute } from 'next';
import { business, productionReady } from '@/lib/business';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap { return productionReady ? ['', '/privacy-policy/', '/terms-of-use/'].map(path=>({url:`${business.domain}${path}`,changeFrequency:'monthly',priority:path ? .3 : 1})) : []; }
