import { Suspense } from 'react';import { RegisterForm } from '@/components/auth/AuthForms';
export const metadata={title:'Registro'};export default function Page(){return <main className="container py-16"><Suspense><RegisterForm/></Suspense></main>}
