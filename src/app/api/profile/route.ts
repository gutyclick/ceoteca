import { NextResponse } from 'next/server';import { demoUser } from '@/lib/auth/demo';
export function GET(){return NextResponse.json({profile:demoUser});}
