import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugify, groupTimeline, eventInputSchema, eventPatchSchema, yearInputSchema,
  fromRow, toRowValues, eventFormPayload, describeIssues, slugWithSuffix, isWofBlob, type WofEvent,
} from "./model.ts";

const ev = (o: Partial<WofEvent>): WofEvent => ({
  id: o.id ?? o.slug ?? "x", slug: "x", year: 2024, sortDate: "2024-01-01",
  dateLabel: "Jan 1, 2024", title: "T", description: "", milestone: null,
  significance: null, imageUrl: null, youtubeUrl: null, needsReview: false, ...o,
});

test("slugify keeps ascii words, drops Korean and punctuation", () => {
  assert.equal(slugify(2024, "DURE (두레) Fasting Retreat"), "2024-dure-fasting-retreat");
  assert.equal(slugify(2024, "Sports Monster 1st Bungae (번개) Fellowship"), "2024-sports-monster-1st-bungae-fellowship");
  assert.equal(slugify(2025, "Pray 4 Korea"), "2025-pray-4-korea");
});

test("slugify never returns an empty tail", () => {
  assert.equal(slugify(2026, "두레"), "2026-event");
  assert.equal(slugify(2026, "  !!! "), "2026-event");
});

test("groupTimeline sorts years and events, hides review rows and empty years", () => {
  const years = [{ year: 2026, theme: "Be · Ready · Be Ready" }, { year: 2024, theme: "A" }, { year: 2025, theme: "B" }];
  const events = [
    ev({ slug: "b", year: 2024, sortDate: "2024-05-01", title: "B" }),
    ev({ slug: "a", year: 2024, sortDate: "2024-01-01", title: "A" }),
    ev({ slug: "r", year: 2025, sortDate: "2025-01-01", needsReview: true }),
    ev({ slug: "d", year: 2026, sortDate: "2026-03-01", needsReview: true }),
  ];
  const pub = groupTimeline(years, events, { includeReview: false });
  assert.deepEqual(pub.map((g) => g.year), [2024]);
  assert.deepEqual(pub[0].events.map((e) => e.slug), ["a", "b"]);

  const all = groupTimeline(years, events, { includeReview: true });
  assert.deepEqual(all.map((g) => g.year), [2024, 2025, 2026]);
});

test("groupTimeline breaks sort_date ties by title", () => {
  const g = groupTimeline([{ year: 2025, theme: "x" }], [
    ev({ slug: "z", year: 2025, sortDate: "2025-07-28", title: "Korea Mission" }),
    ev({ slug: "y", year: 2025, sortDate: "2025-07-28", title: "Indonesia" }),
  ], { includeReview: false });
  assert.deepEqual(g[0].events.map((e) => e.title), ["Indonesia", "Korea Mission"]);
});

test("groupTimeline keeps an event whose year has no theme row, with empty theme", () => {
  const g = groupTimeline([], [ev({ year: 2024 })], { includeReview: false });
  assert.equal(g[0].year, 2024);
  assert.equal(g[0].theme, "");
});

const valid = {
  slug: "2024-good-friday-service", year: 2024, sortDate: "2024-03-29",
  dateLabel: "Mar 29, 2024", title: "Good Friday Service", description: "d",
  milestone: "Washing feet", significance: "s", youtubeUrl: null, needsReview: false,
};

test("eventInputSchema accepts a valid event and turns empty strings into null", () => {
  const r = eventInputSchema.parse({ ...valid, milestone: "  ", significance: "", youtubeUrl: "" });
  assert.equal(r.milestone, null);
  assert.equal(r.significance, null);
  assert.equal(r.youtubeUrl, null);
});

test("eventInputSchema treats omitted optional fields as null (admin create omits imageUrl)", () => {
  const { youtubeUrl: _y, milestone: _m, significance: _s, ...rest } = valid;
  const r = eventInputSchema.parse(rest);
  assert.equal(r.youtubeUrl, null);
  assert.equal(r.milestone, null);
});

test("eventInputSchema enforces limits and formats", () => {
  const bad = (o: object) => assert.equal(eventInputSchema.safeParse({ ...valid, ...o }).success, false, JSON.stringify(o).slice(0, 60));
  bad({ title: "" });
  bad({ title: "x".repeat(121) });
  bad({ dateLabel: "x".repeat(61) });
  bad({ description: "x".repeat(1001) });
  bad({ milestone: "x".repeat(61) });
  bad({ significance: "x".repeat(401) });
  bad({ slug: "Has Caps" });
  bad({ slug: "x".repeat(81) });
  bad({ year: 2021 });
  bad({ sortDate: "2024-02-30" });
  bad({ sortDate: "Mar 29" });
  bad({ imageUrl: "https://a.public.blob.vercel-storage.com/bulletin/x.jpg" }); // photos only via the upload route
  bad({ youtubeUrl: "javascript:alert(1)" });
  bad({ unknownField: 1 });
});

test("eventInputSchema accepts the maximum lengths exactly", () => {
  const r = eventInputSchema.safeParse({ ...valid, title: "x".repeat(120), description: "x".repeat(1000), milestone: "x".repeat(60), significance: "x".repeat(400) });
  assert.equal(r.success, true);
});

test("eventPatchSchema allows partial updates but keeps the rules", () => {
  assert.equal(eventPatchSchema.safeParse({ needsReview: false }).success, true);
  assert.equal(eventPatchSchema.safeParse({ title: "" }).success, false);
  assert.equal(eventPatchSchema.safeParse({}).success, false);
});

test("eventPatchSchema leaves omitted fields out instead of nulling them", () => {
  const r = eventPatchSchema.parse({ title: "New" });
  assert.deepEqual(Object.keys(r), ["title"]);
});

test("eventFormPayload drops id and imageUrl so an edited event passes the strict schemas", () => {
  const edited = ev({ id: "60543b3e-e5dd-431f-a89e-a27490648f26", slug: "2024-x", imageUrl: "https://a.public.blob.vercel-storage.com/x.jpg", milestone: "Tag" });
  const body = eventFormPayload(edited);
  assert.equal("id" in body, false);
  assert.equal("imageUrl" in body, false);
  assert.equal(eventPatchSchema.safeParse(body).success, true);
  assert.equal(eventInputSchema.safeParse(body).success, true);
});

test("describeIssues names the failing fields", () => {
  const r = eventPatchSchema.safeParse({ title: "", youtubeUrl: "http://x" });
  assert.equal(r.success, false);
  if (!r.success) assert.match(describeIssues(r.error.flatten()), /title.*youtubeUrl|youtubeUrl.*title/);
  assert.equal(describeIssues(undefined), "");
});

test("eventPatchSchema rejects imageUrl so a PATCH can't point an event at someone else's blob", () => {
  assert.equal(eventPatchSchema.safeParse({ imageUrl: "https://x.public.blob.vercel-storage.com/wall-of-faith/a.jpg" }).success, false);
});

test("slugWithSuffix numbers repeats and stays within 80 chars", () => {
  assert.equal(slugWithSuffix("2026-event", 1), "2026-event");
  assert.equal(slugWithSuffix("2026-event", 2), "2026-event-2");
  const long = "2026-" + "a".repeat(75);
  assert.equal(slugWithSuffix(long, 12).length <= 80, true);
  assert.match(slugWithSuffix(long, 12), /-12$/);
});

test("isWofBlob only accepts Vercel Blob URLs under /wall-of-faith/", () => {
  assert.equal(isWofBlob("https://igmgr3ejlj7zobya.public.blob.vercel-storage.com/wall-of-faith/2024-x-1a2b3c4d.jpg"), true);
  assert.equal(isWofBlob("https://igmgr3ejlj7zobya.public.blob.vercel-storage.com/bulletin/flyer.jpg"), false);
  assert.equal(isWofBlob("https://evil.example/.blob.vercel-storage.com/wall-of-faith/x.jpg"), false);
  assert.equal(isWofBlob("https://x.public.blob.vercel-storage.com.evil.io/wall-of-faith/x.jpg"), false);
  assert.equal(isWofBlob(null), false);
  assert.equal(isWofBlob("not a url"), false);
});

test("yearInputSchema", () => {
  assert.equal(yearInputSchema.safeParse({ year: 2026, theme: "Be · Ready · Be Ready" }).success, true);
  assert.equal(yearInputSchema.safeParse({ year: 2026, theme: "" }).success, false);
});

test("row mapping round-trips", () => {
  const row = { id: "1", image_url: null, ...toRowValues(eventInputSchema.parse(valid)) };
  const e = fromRow(row);
  assert.equal(e.sortDate, "2024-03-29");
  assert.equal(e.dateLabel, "Mar 29, 2024");
  assert.equal(e.needsReview, false);
  assert.equal(row.sort_date, "2024-03-29");
});
