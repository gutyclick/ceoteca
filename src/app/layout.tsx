import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';
const geist = Geist({ subsets:['latin'], variable:'--font-geist' });
export const metadata: Metadata = { metadataBase:new URL(siteConfig.url), title:{ default:siteConfig.title, template:'%s — Ceoteca' }, description:siteConfig.description, openGraph:{ title:siteConfig.title, description:siteConfig.description, type:'website', locale:'es_ES' }, twitter:{ card:'summary_large_image', title:siteConfig.title, description:siteConfig.description }, alternates:{ canonical:'/' } };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es" className={geist.variable}><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'SoftwareApplication',name:'Ceoteca',applicationCategory:'EducationalApplication',operatingSystem:'Web',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}})}} /></body></html>}
