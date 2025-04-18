import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
 
export async function GET() {
  const val = await get('events');
 
  return NextResponse.json(val);
}