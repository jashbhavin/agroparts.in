import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Website';
import { business, productionReady } from '@/lib/business';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import './globals.css';
export const metadata: Metadata = {
 title: 'Agro Engineering Solutions | Agricultural Machinery & Equipment',
 description: 'Explore Agro Engineering Solutions: agricultural machinery, equipment, spare parts, and practical engineering solutions for agricultural businesses in India.',
 ...(business.domain ? {metadataBase: new URL(business.domain), alternates: {canonical: '/'}} : {}),
 robots: {index: productionReady, follow: productionReady},
 icons: {icon: [{url: '/favicon.ico', sizes: 'any'}, {url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32'}, {url: '/favicon-192x192.png', type: 'image/png', sizes: '192x192'}], apple: [{url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png'}]},
 openGraph: {type:'website',locale:'en_IN',siteName:business.tradeName,title:'Agro Engineering Solutions',description:business.businessDescription,...(business.domain ? {images:[{url:'/images/agro-logo.png',width:148,height:148,alt:'Agro Engineering Solutions logo'}]} : {}), ...(business.domain ? {url:business.domain} : {})},
};
export default function RootLayout({children}:{children:React.ReactNode}) { const jsonLd = productionReady ? {'@context':'https://schema.org','@type':'Organization',name:business.legalName,alternateName:business.tradeName,url:business.domain,logo:`${business.domain}/images/agro-logo.png`,telephone:business.phone,email:business.email,address:{'@type':'PostalAddress',streetAddress:business.address,addressLocality:business.city,addressRegion:business.state,postalCode:business.postalCode,addressCountry:'IN'},sameAs:business.socialLinks} : null; return <html lang="en"><body><a href="#main" className="skip-link">Skip to content</a><Header/><main id="main">{children}</main><Footer/>{jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/>}</body></html>; }
