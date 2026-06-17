import { NextResponse } from 'next/server';
export function GET(){return NextResponse.json({provider:process.env.PAYMENTS_PROVIDER ?? 'disabled',status:'demo'});}
