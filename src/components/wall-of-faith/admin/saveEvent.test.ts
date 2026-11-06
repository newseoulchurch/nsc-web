import { test } from "node:test";
import assert from "node:assert/strict";
import { saveEvent } from "./saveEvent.ts";
import type { WofEvent } from "../../../lib/wall-of-faith/model.ts";

const draft: Omit<WofEvent, "id"> = {
  slug: "", year: 2026, sortDate: "2026-01-01", dateLabel: "Jan 2026", title: "수련회", description: "",
  milestone: null, significance: null, imageUrl: null, youtubeUrl: null, needsReview: true,
};
const created: WofEvent = { ...draft, id: "11111111-1111-4111-8111-111111111111", slug: "2026-event" };
const photo = new File(["x"], "a.png", { type: "image/png" });
const compress = async (f: File) => new File([f], "a.jpg", { type: "image/jpeg" });

type Call = { url: string; method: string };
function fakeFetch(responses: Record<string, () => Response>) {
  const calls: Call[] = [];
  const fn = (async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ url, method });
    const make = responses[`${method} ${url}`];
    if (!make) throw new Error(`unexpected ${method} ${url}`);
    return make();
  }) as typeof fetch;
  return { fn, calls };
}
const json = (body: unknown, status = 200) => () =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

test("upload failure after a new event's text save returns the saved event and the photo error", async () => {
  const f = fakeFetch({
    "POST /api/wall-of-faith/events": json({ event: created }, 201),
    "POST /api/wall-of-faith/upload": json({ error: "boom" }, 500),
  });
  const r = await saveEvent(draft, undefined, photo, { fetch: f.fn, compress });
  assert.equal(r.saved?.id, created.id);
  assert.equal(r.saved?.imageUrl, null);
  assert.match(r.error ?? "", /사진 실패: boom/);
});

test("saving again after a failed upload patches the saved event instead of creating a duplicate", async () => {
  const f = fakeFetch({
    [`PATCH /api/wall-of-faith/events/${created.id}`]: json({ event: created }),
    "POST /api/wall-of-faith/upload": json({ url: "https://x.public.blob.vercel-storage.com/wall-of-faith/a.jpg" }),
  });
  const r = await saveEvent(created, created, photo, { fetch: f.fn, compress });
  assert.deepEqual(f.calls.map((c) => c.method), ["PATCH", "POST"]);
  assert.equal(r.error, null);
  assert.equal(r.saved?.imageUrl, "https://x.public.blob.vercel-storage.com/wall-of-faith/a.jpg");
});

test("a non-JSON upload response still reports the photo error with its status", async () => {
  const f = fakeFetch({
    "POST /api/wall-of-faith/events": json({ event: created }, 201),
    "POST /api/wall-of-faith/upload": () => new Response("<html>Gateway Timeout</html>", { status: 504 }),
  });
  const r = await saveEvent(draft, undefined, photo, { fetch: f.fn, compress });
  assert.equal(r.saved?.id, created.id);
  assert.match(r.error ?? "", /사진 실패: HTTP 504/);
});

test("a photo that cannot be processed stops before anything is saved", async () => {
  const f = fakeFetch({});
  const bad = async () => { throw new Error("이미지를 처리하지 못했습니다."); };
  const r = await saveEvent(draft, undefined, photo, { fetch: f.fn, compress: bad });
  assert.equal(f.calls.length, 0);
  assert.equal(r.saved, null);
  assert.equal(r.error, "이미지를 처리하지 못했습니다.");
});

test("fetch is called unbound, as window.fetch requires (receiver must not be the deps object)", async () => {
  const f = fakeFetch({ "POST /api/wall-of-faith/events": json({ event: created }, 201) });
  const strictFetch = (function (this: unknown, url: string, init?: RequestInit) {
    if (this !== undefined && this !== globalThis) throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
    return f.fn(url, init);
  }) as typeof fetch;
  const r = await saveEvent(draft, undefined, null, { fetch: strictFetch, compress });
  assert.equal(r.error, null);
  assert.equal(r.saved?.id, created.id);
});

test("a rejected text save names the invalid fields and saves nothing", async () => {
  const f = fakeFetch({
    "POST /api/wall-of-faith/events": json({ error: "Invalid input", issues: { fieldErrors: { title: ["Required"] } } }, 400),
  });
  const r = await saveEvent(draft, undefined, photo, { fetch: f.fn, compress });
  assert.equal(f.calls.length, 1);
  assert.equal(r.saved, null);
  assert.equal(r.error, "확인 필요: title");
});
