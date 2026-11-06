// Pure helpers for the Wall of Faith photo scripts.
import { createHash } from "node:crypto";

// Content-addressed key: re-running with the same picked file maps to the same blob.
export function blobKey(slug, bytes) {
  const h = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
  return `wall-of-faith/${slug}-${h}.jpg`;
}

export function parsePicks(json) {
  const o = JSON.parse(json);
  if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("picks must be an object");
  for (const [k, v] of Object.entries(o)) {
    if (!/^[a-z0-9-]+$/.test(k)) throw new Error(`bad slug ${k}`);
    if (typeof v !== "string") throw new Error(`bad path for ${k}`);
  }
  return o;
}
