import { describeIssues, eventFormPayload, type WofEvent } from "../../../lib/wall-of-faith/model.ts";

type Deps = { fetch: typeof fetch; compress: (f: File) => Promise<File> };
export type SaveResult = { saved: WofEvent | null; error: string | null };

// A body that isn't JSON (proxy error page, timeout) reads as {} so the caller falls back to the status.
async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const j = await res.json();
    return j && typeof j === "object" ? j : {};
  } catch {
    return {};
  }
}
const errorOf = (j: Record<string, unknown>, res: Response) =>
  typeof j.error === "string" ? j.error : `HTTP ${res.status}`;

// Photo is compressed first, so a bad file stops before anything is written.
// When the text saves but the photo doesn't, `saved` is still returned: the caller must
// treat the event as existing from then on (a retry PATCHes instead of POSTing a duplicate).
export async function saveEvent(
  draft: Omit<WofEvent, "id">,
  existing: WofEvent | undefined,
  file: File | null,
  { fetch: doFetch, compress }: Deps, // destructured: window.fetch throws "Illegal invocation" when called as deps.fetch()
): Promise<SaveResult> {
  let photo: File | null = null;
  try {
    if (file) photo = await compress(file);
  } catch (e) {
    return { saved: null, error: (e as Error).message };
  }

  // Never send id or imageUrl (strict schema); a new event's slug is derived server-side.
  const body = { ...eventFormPayload(draft), slug: existing ? draft.slug : "" };
  const res = await doFetch(existing ? `/api/wall-of-faith/events/${existing.id}` : "/api/wall-of-faith/events", {
    method: existing ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await readJson(res);
  if (!res.ok || !j.event) {
    const fields = describeIssues(j.issues);
    return { saved: null, error: fields ? `확인 필요: ${fields}` : res.ok ? "저장 실패" : errorOf(j, res) };
  }
  const saved = j.event as WofEvent;
  if (!photo) return { saved, error: null };

  const fd = new FormData();
  fd.append("file", photo);
  fd.append("eventId", saved.id);
  const up = await doFetch("/api/wall-of-faith/upload", { method: "POST", body: fd });
  const uj = await readJson(up);
  if (!up.ok || typeof uj.url !== "string") {
    return { saved, error: `글은 저장됨, 사진 실패: ${up.ok ? "응답에 URL 없음" : errorOf(uj, up)}` };
  }
  return { saved: { ...saved, imageUrl: uj.url }, error: null };
}
