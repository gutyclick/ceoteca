import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
export default function sitemap(): MetadataRoute.Sitemap { return ['','/pricing','/registro','/login','/biblioteca','/home','/perfil','/planes','/terminos','/privacidad'].map((path)=>({url:`${siteConfig.url}${path}`,lastModified:new Date()})); }
