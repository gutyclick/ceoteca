import { Footer } from '@/components/marketing/Footer';import { PublicHeader } from '@/components/marketing/PublicHeader';
export default function MarketingLayout({children}:{children:React.ReactNode}){return <><PublicHeader/>{children}<Footer/></>}
