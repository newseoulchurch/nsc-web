import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { adminDb, requireAdmin, badRequest, isOurBlob, UUID_RE } from "@/lib/wall-of-faith/server";
import { eventPatchSchema, fromRow, toRowPatch, WOF_EVENT_COLUMNS, type WofRow } from "@/lib/wall-of-faith/model";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!UUID_RE.test(id)) return badRequest("Invalid id");
  const parsed = eventPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const { data, error } = await adminDb().from("wall_of_faith_events")
    .update({ ...toRowPatch(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id).select(WOF_EVENT_COLUMNS).maybeSingle();
  if (error?.code === "23505") return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  if (error?.code === "23503") return badRequest("That year has no theme row");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event: fromRow(data as unknown as WofRow) });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!UUID_RE.test(id)) return badRequest("Invalid id");
  const { data, error } = await adminDb().from("wall_of_faith_events").delete().eq("id", id).select("image_url").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (isOurBlob(data.image_url)) await del(data.image_url).catch(() => {});
  return NextResponse.json({ ok: true });
}
