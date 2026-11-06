import { NextResponse } from "next/server";
import { adminDb, requireAdmin, badRequest } from "@/lib/wall-of-faith/server";
import { yearInputSchema } from "@/lib/wall-of-faith/model";

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = yearInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.flatten());
  const { data, error } = await adminDb().from("wall_of_faith_years").upsert(parsed.data).select("year, theme").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ year: data });
}
