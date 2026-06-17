import Link from 'next/link';
import type { ReactNode } from 'react';
export function GradientButton({href,children}:{href:string;children:ReactNode}){return <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 px-6 font-bold shadow-[0_0_35px_rgba(168,85,247,.35)] transition hover:scale-[1.02]" href={href}>{children}</Link>}
export function SecondaryButton({href,children}:{href:string;children:ReactNode}){return <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 font-bold transition hover:bg-white/10" href={href}>{children}</Link>}
