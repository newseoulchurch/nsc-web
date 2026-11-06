import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { adminDb, requireAdmin, badRequest, isOurBlob, UUID_RE } from "@/lib/wall-of-faith/server";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Order matters: new blob → row points at it → only then delete the old blob.
// If the row update fails, the new blob is dropped and the old photo stays.
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const form = await request.formData();
  const file = form.get("file");
  const eventId = form.get("eventId");
  if (!(file instanceof File)) return badRequest("No file provided");
  if (!TYPES.has(file.type)) return badRequest("JPEG, PNG or WebP only");
  if (file.size > MAX_BYTES) return badRequest("File exceeds 5MB");
  if (eventId !== null && (typeof eventId !== "string" || !UUID_RE.test(eventId))) return badRequest("Invalid eventId");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`wall-of-faith/upload-${Date.now()}.${ext}`, file, { access: "public", addRandomSuffix: true });
  if (!eventId) return NextResponse.json({ url: blob.url });

  const db = adminDb();
  const { data: before } = await db.from("wall_of_faith_events").select("image_url").eq("id", eventId).maybeSingle();
  if (!before) {
    await del(blob.url).catch(() => {});
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { error } = await db.from("wall_of_faith_events")
    .update({ image_url: blob.url, updated_at: new Date().toISOString() }).eq("id", eventId);
  if (error) {
    await del(blob.url).catch(() => {});
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (isOurBlob(before.image_url) && before.image_url !== blob.url) await del(before.image_url).catch(() => {});
  return NextResponse.json({ url: blob.url });
}
