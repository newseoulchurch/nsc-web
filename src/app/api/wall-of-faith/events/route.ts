import { NextResponse } from "next/server";
import { adminDb, requireAdmin, badRequest } from "@/lib/wall-of-faith/server";
import { eventInputSchema, fromRow, slugify, toRowValues, WOF_EVENT_COLUMNS, type WofRow } from "@/lib/wall-of-faith/model";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return badRequest("Body must be a JSON object");
  const withSlug = { ...body, slug: body.slug || slugify(Number(body.year), String(body.title ?? "")) };
  const parsed = eventInputSchema.safeParse(withSlug);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const db = adminDb();
  const { data: year } = await db.from("wall_of_faith_years").select("year").eq("year", parsed.data.year).maybeSingle();
  if (!year) return badRequest(`Year ${parsed.data.year} has no theme row; add the year first`);

  const { data, error } = await db.from("wall_of_faith_events").insert(toRowValues(parsed.data)).select(WOF_EVENT_COLUMNS).single();
  if (error?.code === "23505") return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: fromRow(data as unknown as WofRow) }, { status: 201 });
}
