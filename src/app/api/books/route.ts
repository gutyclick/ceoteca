import { NextResponse } from 'next/server';import { demoBooks } from '@/data/books';
export function GET(){return NextResponse.json({books:demoBooks});}
