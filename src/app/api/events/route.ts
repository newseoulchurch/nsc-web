import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
import z from 'zod'; 
import { getEdgeConfigCredentials } from '@/lib/edge-config';
 
const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(), 
  location: z.string(),
  description: z.string().optional(),
});

export async function GET() {
  const val = await get('events');
 
  return NextResponse.json(val);
}

export async function PUT(req: Request) {
  const body = await req.json();

  const parsed = z.array(EventSchema).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format", details: parsed.error }, { status: 400 });
  }


  const { edgeConfigId, token } = getEdgeConfigCredentials(); 

  if (!edgeConfigId || !token) {
    return NextResponse.json({ error: "Could not extract Edge Config credentials" }, { status: 500 });
  }

  const res = await fetch(`https://edge-config.vercel.com/${edgeConfigId}/items`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ key: "events", value: parsed.data }],
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    return NextResponse.json({ error: "Failed to update Edge Config", details: error }, { status: 500 });
  }

  return NextResponse.json({ message: "Events updated successfully" });
}
