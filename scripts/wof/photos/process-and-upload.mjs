// scripts/wof/photos/process-and-upload.mjs
//   node --env-file=.env.local scripts/wof/photos/process-and-upload.mjs [--dry-run]
// For each pick in .wof-photos/picks.json: 1600px long edge, JPEG, all metadata stripped (ffmpeg),
// put() to Blob as wall-of-faith/<slug>-<hash>.jpg, then point the event's image_url at it.
// Order per event: upload → update row → delete the old blob. A failed update drops the new blob.
import { readFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { put, del } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";
import { blobKey, parsePicks } from "./lib.mjs";

const dry = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const ROOT = resolve(".wof-photos");
const OUT = join(ROOT, "_out");
mkdirSync(OUT, { recursive: true });
const picks = parsePicks(readFileSync(join(ROOT, "picks.json"), "utf8"));
for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "BLOB_READ_WRITE_TOKEN"]) {
  if (!process.env[k]) throw new Error(`${k} missing — run with --env-file=.env.local`);
}
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ours = (u) => { try { const x = new URL(u); return x.hostname.endsWith(".public.blob.vercel-storage.com") && x.pathname.startsWith("/wall-of-faith/"); } catch { return false; } };

let ok = 0, same = 0, failed = 0;
for (const [slug, src] of Object.entries(picks)) {
  const { data: row, error } = await db.from("wall_of_faith_events").select("id, image_url").eq("slug", slug).maybeSingle();
  if (error || !row) { console.error(`SKIP  ${slug}: no row`); failed++; continue; }
  const out = join(OUT, `${slug}.jpg`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src,
    "-vf", "scale='if(gt(iw,ih),min(1600,iw),-2)':'if(gt(iw,ih),-2,min(1600,ih))'",
    "-map_metadata", "-1", "-q:v", "4", out]);
  const bytes = readFileSync(out);
  const key = blobKey(slug, bytes);
  if (row.image_url?.endsWith(`/${key}`)) { console.log(`same  ${slug}`); same++; continue; }
  // A photo set some other way (admin upload, older pick) is never overwritten without --force.
  if (row.image_url && !row.image_url.includes(`/wall-of-faith/${slug}-`) && !force) {
    console.log(`keep  ${slug}: has a photo set elsewhere (${row.image_url.split("/").pop()}); --force to replace`); same++; continue;
  }
  if (dry) { console.log(`would upload ${slug} → ${key} (${Math.round(bytes.length / 1024)} KB)`); continue; }
  const blob = await put(key, bytes, { access: "public", contentType: "image/jpeg", addRandomSuffix: false, allowOverwrite: true });
  const { error: upErr } = await db.from("wall_of_faith_events")
    .update({ image_url: blob.url, updated_at: new Date().toISOString() }).eq("id", row.id);
  if (upErr) { await del(blob.url).catch(() => {}); console.error(`FAIL  ${slug}: ${upErr.message}`); failed++; continue; }
  if (ours(row.image_url) && row.image_url !== blob.url) await del(row.image_url).catch(() => {});
  console.log(`ok    ${slug} → ${blob.url}`);
  ok++;
}
console.log(`\n${dry ? "dry run" : "done"}: ${ok} uploaded, ${same} unchanged, ${failed} failed`);
