# Wall of Faith Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Wall of Faith onto Supabase with real photos, Margot's spiritual-milestone layer, a working admin, and two public designs (scrapbook + rebuilt circle spine) for staff to choose between.

**Architecture:** Two Supabase tables seeded by one generated SQL migration; photos in Vercel Blob; a pure, dependency-light domain module (`src/lib/wall-of-faith/model.ts`) holds types, validation, slugging and grouping and is unit-tested with Node's built-in test runner; server pages and API routes follow the bulletin's patterns (service-role client, cookie check, direct DB reads, `force-dynamic`).

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind, `@supabase/supabase-js`, `@vercel/blob`, `zod` (already a dependency), Node 26 `node --test` (native TS type stripping), `ffmpeg`/`sips` for photos, Playwright MCP for UI checks.

**Spec:** `docs/superpowers/specs/2026-11-06-wall-of-faith-design.md`

## Global Constraints

- Repo `~/github/nsc-web`, branch `feature/wall-of-faith`, `origin` = `newseoulchurch/nsc-web`. PRs go there, to `main`.
- Dev server: `node_modules/.bin/next dev -p 3001`. Never `npx next …`. If `node_modules` is missing, `npm ci` first.
- Local dev and Vercel previews use the **production** Supabase DB and Blob store. Any test row is created with `needs_review = true` and deleted after.
- Server code reads Supabase with `createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)`; server pages never fetch the app's own API.
- Every API route: `adminToken` cookie present or 401; invalid input 400; DB error 500.
- Field limits: title 1–120, date_label 1–60, description ≤ 1000, milestone ≤ 60, significance ≤ 400, slug `^[a-z0-9-]+$` (≤ 80), `year` 2022–2100, `sort_date` `YYYY-MM-DD` valid date, URLs `https://` only, theme 1–120.
- Public pages show only `needs_review = false` rows and hide years with no public events.
- Year themes: 2023 "Made New to Make New", 2024 "Walking Toward the Call, Calling All Who Walk", 2025 "Made for More", 2026 "Be · Ready · Be Ready".
- Photos: 1600 px long edge, JPEG q82, all metadata stripped. NAS photos only when Chan picks them per event (`~/github/nsc-photo-archive/CLAUDE.md` hard rule). Never publish photos or contact sheets anywhere (no artifacts, no Drive).
- "Typecheck clean" = `npx tsc --noEmit 2>&1 | grep -E 'wall-of-faith|scripts/wof'` prints nothing (pre-existing errors elsewhere are known).
- Commits: no `Co-Authored-By`, no self-attribution.

## Review Focus

1. **Year with no public events** (all of 2026 while still `needs_review`): the year must not render as an empty band or an orphan pill. Pinned in Task 2 (`groupTimeline` drops empty years) and Task 7/8 Playwright checks.
2. **Event with no photo** (any of the 43 until photos land, NAS gaps forever): both designs show the titled placeholder, never a broken image. Pinned in Task 6 (`EventPhoto`) and checked in Tasks 7–8.
3. **Replacing a photo when the upload or DB update fails**: the old photo must survive; delete the old blob only after the row points at the new one. Pinned in Task 4 (upload route order) and Task 9 Playwright check.
4. **Korean and punctuation in titles** (`DURE (두레) Fasting Retreat`, `Sports Monster 1st Bungae (번개) Fellowship`): slugs stay ASCII and non-empty; text renders. Pinned in Task 2 slug tests.
5. **Long text at phone width** (1000-char description, 400-char significance, 60-char milestone): wraps without horizontal scroll in both designs and in the spine detail card. Checked in Tasks 7–8 with a temporary max-length row, made public only for the check and then deleted.

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/wall-of-faith/model.ts` | Types, row↔model mapping, zod input schemas, `slugify`, `groupTimeline`. No Next/Supabase imports. |
| `src/lib/wall-of-faith/model.test.ts` | Unit tests (`node --test`). |
| `src/lib/wall-of-faith/load.ts` | `loadWallOfFaith(db, opts)` — the only DB read path for pages. |
| `src/lib/wall-of-faith/server.ts` | `adminDb()`, `requireAdmin()` helpers for routes. |
| `src/app/api/wall-of-faith/events/route.ts` | POST create. |
| `src/app/api/wall-of-faith/events/[id]/route.ts` | PATCH update, DELETE (+ blob). |
| `src/app/api/wall-of-faith/upload/route.ts` | POST image → Blob; optional replace for an event. |
| `src/app/api/wall-of-faith/years/route.ts` | PUT upsert year theme. |
| `src/app/admin/wall-of-faith/page.tsx` | Server: loads everything, renders `WofAdmin`. |
| `src/components/wall-of-faith/admin/WofAdmin.tsx` | Client admin UI (list, filter, years). |
| `src/components/wall-of-faith/admin/EventForm.tsx` | Client edit/create form incl. photo. |
| `src/components/wall-of-faith/admin/compressImage.ts` | Browser image compression (≤1600 px, ~500 KB). |
| `src/components/wall-of-faith/EventPhoto.tsx` | Shared photo with titled placeholder. |
| `src/components/wall-of-faith/MilestoneBadge.tsx` | Shared milestone pill. |
| `src/components/wall-of-faith/PolaroidCard.tsx`, `YearSection.tsx` | Scrapbook (modified). |
| `src/app/wall-of-faith/page.tsx` | Scrapbook page (modified). |
| `src/components/wall-of-faith/spine/*.tsx` | Circle spine components. |
| `src/app/wall-of-faith-2/page.tsx` | Circle spine page. |
| `scripts/wof/seed.ts` | Seed content: base events + Margot's overrides + drafted additions. Deleted in Task 7. |
| `scripts/wof/build-migration.ts` (+ `.test.ts`) | Generates the SQL migration. Deleted in Task 7. |
| `docs/superpowers/migrations/2026-11-06-wall-of-faith.sql` | Generated; Chan runs it. Kept as the record. |
| `scripts/wof/photos/lib.mjs` (+ `lib.test.mjs`) | Pure helpers: blob key, picks parsing. |
| `scripts/wof/photos/make-picker.mjs` | Builds `.wof-photos/picker.html` + thumbs. |
| `scripts/wof/photos/process-and-upload.mjs` | Resize/strip, `put()` to Blob, update `image_url`. |

---

### Task 1: Rebase the branch and add the test runner

The branch is 61 commits behind `main`. Rebasing now (rather than at ship time, as the spec had it) means the admin and pages are built against current `main`. `5b2dadb` duplicates bulletin docs that are already on `main`, so it is dropped.

**Files:**
- Modify: `package.json` (scripts), `tsconfig.json` (`allowImportingTsExtensions`), `.gitignore`
- Add: `docs/superpowers/specs/2026-11-06-wall-of-faith-design.md`, this plan

**Interfaces:**
- Produces: `npm test` → `node --test 'src/**/*.test.ts' 'scripts/**/*.test.ts' 'scripts/**/*.test.mjs'`

- [ ] **Step 1: Stop the dev server and confirm a clean tree except the two docs**

Run: `pkill -f "next dev -p 3001"; cd ~/github/nsc-web && git status -s`
Expected: only `?? docs/superpowers/plans/2026-11-06-wall-of-faith.md` and `?? docs/superpowers/specs/2026-11-06-wall-of-faith-design.md`

- [ ] **Step 2: Rebase onto main, dropping 5b2dadb**

`5b2dadb` sits between `d8289ae` and `0d3fc4c`, and interactive rebase is unavailable, so rebuild the branch by cherry-picking the six Wall of Faith commits onto `origin/main`:
```bash
cd ~/github/nsc-web
git fetch origin
git branch wof-backup feature/wall-of-faith
git switch -c wof-rebased origin/main
git cherry-pick 03fe07d 541d8a2 76349ca 8e1277a d8289ae 0d3fc4c
```
Expected: six picks apply. If `0d3fc4c` conflicts on `.gitignore`, keep both sides (main's lines + `CLAUDE.md`).

- [ ] **Step 3: Replace the branch and verify**

```bash
git branch -f feature/wall-of-faith wof-rebased && git switch feature/wall-of-faith && git branch -D wof-rebased
git log --oneline origin/main..feature/wall-of-faith   # expect 6 commits, no "bulletin spec"
git rev-list --count feature/wall-of-faith..origin/main  # expect 0
```

- [ ] **Step 4: Add test script and TS extension imports**

`package.json` scripts gain:
```json
"test": "node --test 'src/**/*.test.ts' 'scripts/**/*.test.ts' 'scripts/**/*.test.mjs'"
```
`tsconfig.json` `compilerOptions` gains `"allowImportingTsExtensions": true` (valid because `noEmit` is true).
`.gitignore` gains:
```
# wall of faith photo staging (never commit)
.wof-photos/
```

- [ ] **Step 5: Sanity-run the runner**

Run: `npm test`
Expected: exits 0 with "tests 0" (no test files yet) — or a "no test files" notice; either is fine.

- [ ] **Step 6: Commit and force-push the rebased branch**

```bash
git add package.json tsconfig.json .gitignore docs/superpowers/specs/2026-11-06-wall-of-faith-design.md docs/superpowers/plans/2026-11-06-wall-of-faith.md
git commit -m "chore(wof): rebase on main, add spec/plan and node test runner"
git push --force-with-lease origin feature/wall-of-faith
git branch -D wof-backup
```
Ask Chan before the force-push (it rewrites a pushed branch only he uses).

---

### Task 2: Domain model, validation, slugging, grouping

**Files:**
- Create: `src/lib/wall-of-faith/model.ts`
- Test: `src/lib/wall-of-faith/model.test.ts`

**Interfaces:**
- Produces:
  - `type WofEvent = { id: string; slug: string; year: number; sortDate: string; dateLabel: string; title: string; description: string; milestone: string | null; significance: string | null; imageUrl: string | null; youtubeUrl: string | null; needsReview: boolean }`
  - `type WofYear = { year: number; theme: string }`
  - `type WofYearGroup = WofYear & { events: WofEvent[] }`
  - `type WofRow` (snake_case DB row), `fromRow(r: WofRow): WofEvent`
  - `eventInputSchema` (zod), `type EventInput = z.infer<typeof eventInputSchema>`, `toRowValues(i: EventInput): Omit<WofRow, "id">`
  - `eventPatchSchema` (all fields optional, same rules)
  - `yearInputSchema` → `{ year: number; theme: string }`
  - `slugify(year: number, title: string): string`
  - `groupTimeline(years: WofYear[], events: WofEvent[], opts: { includeReview: boolean }): WofYearGroup[]`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/wall-of-faith/model.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugify, groupTimeline, eventInputSchema, eventPatchSchema, yearInputSchema,
  fromRow, toRowValues, type WofEvent,
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
  milestone: "Washing feet", significance: "s", imageUrl: null, youtubeUrl: null, needsReview: false,
};

test("eventInputSchema accepts a valid event and turns empty strings into null", () => {
  const r = eventInputSchema.parse({ ...valid, milestone: "  ", significance: "", youtubeUrl: "" });
  assert.equal(r.milestone, null);
  assert.equal(r.significance, null);
  assert.equal(r.youtubeUrl, null);
});

test("eventInputSchema treats omitted optional fields as null (admin create omits imageUrl)", () => {
  const { imageUrl, youtubeUrl, milestone, significance, ...rest } = valid;
  const r = eventInputSchema.parse(rest);
  assert.equal(r.imageUrl, null);
  assert.equal(r.milestone, null);
});

test("eventInputSchema enforces limits and formats", () => {
  const bad = (o: object) => assert.equal(eventInputSchema.safeParse({ ...valid, ...o }).success, false);
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
  bad({ imageUrl: "http://insecure.example/x.jpg" });
  bad({ youtubeUrl: "javascript:alert(1)" });
});

test("eventInputSchema accepts the maximum lengths exactly", () => {
  const r = eventInputSchema.safeParse({ ...valid, title: "x".repeat(120), description: "x".repeat(1000), milestone: "x".repeat(60), significance: "x".repeat(400) });
  assert.equal(r.success, true);
});

test("eventPatchSchema allows partial updates but keeps the rules", () => {
  assert.equal(eventPatchSchema.safeParse({ needsReview: false }).success, true);
  assert.equal(eventPatchSchema.safeParse({ title: "" }).success, false);
  assert.equal(eventPatchSchema.safeParse({}).success, false); // nothing to update
});

test("yearInputSchema", () => {
  assert.equal(yearInputSchema.safeParse({ year: 2026, theme: "Be · Ready · Be Ready" }).success, true);
  assert.equal(yearInputSchema.safeParse({ year: 2026, theme: "" }).success, false);
});

test("row mapping round-trips", () => {
  const row = { id: "1", ...toRowValues(eventInputSchema.parse(valid)) };
  const e = fromRow(row);
  assert.equal(e.sortDate, "2024-03-29");
  assert.equal(e.dateLabel, "Mar 29, 2024");
  assert.equal(e.needsReview, false);
  assert.equal(row.sort_date, "2024-03-29");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot find module `./model.ts`

- [ ] **Step 3: Implement**

```ts
// src/lib/wall-of-faith/model.ts
import { z } from "zod";

export type WofEvent = {
  id: string; slug: string; year: number; sortDate: string; dateLabel: string;
  title: string; description: string; milestone: string | null; significance: string | null;
  imageUrl: string | null; youtubeUrl: string | null; needsReview: boolean;
};
export type WofYear = { year: number; theme: string };
export type WofYearGroup = WofYear & { events: WofEvent[] };

export type WofRow = {
  id: string; slug: string; year: number; sort_date: string; date_label: string;
  title: string; description: string; milestone: string | null; significance: string | null;
  image_url: string | null; youtube_url: string | null; needs_review: boolean;
};

export const WOF_EVENT_COLUMNS =
  "id, slug, year, sort_date, date_label, title, description, milestone, significance, image_url, youtube_url, needs_review";

export function fromRow(r: WofRow): WofEvent {
  return {
    id: r.id, slug: r.slug, year: r.year, sortDate: r.sort_date, dateLabel: r.date_label,
    title: r.title, description: r.description ?? "", milestone: r.milestone, significance: r.significance,
    imageUrl: r.image_url, youtubeUrl: r.youtube_url, needsReview: r.needs_review,
  };
}

// Missing or blank → null. (In eventPatchSchema the .partial() wrapper sees undefined first, so an
// omitted field stays omitted there; only the full create schema turns it into null.)
const blankToNull = (v: unknown) => (v === undefined || (typeof v === "string" && v.trim() === "") ? null : v);
const optText = (max: number) =>
  z.preprocess(blankToNull, z.string().trim().max(max).nullable());
const httpsUrl = z.preprocess(
  blankToNull,
  z.string().url().refine((u) => u.startsWith("https://"), "must be https").nullable(),
);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}, "invalid date");

const eventShape = {
  slug: z.string().regex(/^[a-z0-9-]+$/).max(80),
  year: z.number().int().min(2022).max(2100),
  sortDate: isoDate,
  dateLabel: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(120),
  description: z.preprocess((v) => (v == null ? "" : v), z.string().trim().max(1000)),
  milestone: optText(60),
  significance: optText(400),
  imageUrl: httpsUrl,
  youtubeUrl: httpsUrl,
  needsReview: z.boolean(),
};

export const eventInputSchema = z.object(eventShape).strict();
export type EventInput = z.infer<typeof eventInputSchema>;

export const eventPatchSchema = z
  .object(eventShape).partial().strict()
  .refine((o) => Object.keys(o).length > 0, "nothing to update");
export type EventPatch = z.infer<typeof eventPatchSchema>;

export const yearInputSchema = z.object({
  year: z.number().int().min(2022).max(2100),
  theme: z.string().trim().min(1).max(120),
}).strict();

const COLUMN: Record<keyof EventInput, keyof WofRow> = {
  slug: "slug", year: "year", sortDate: "sort_date", dateLabel: "date_label", title: "title",
  description: "description", milestone: "milestone", significance: "significance",
  imageUrl: "image_url", youtubeUrl: "youtube_url", needsReview: "needs_review",
};

export function toRowValues(i: EventInput): Omit<WofRow, "id"> {
  return toRowPatch(i) as Omit<WofRow, "id">;
}

export function toRowPatch(p: EventPatch): Partial<WofRow> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) out[COLUMN[k as keyof EventInput]] = v;
  return out as Partial<WofRow>;
}

export function slugify(year: number, title: string): string {
  const tail = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${year}-${tail || "event"}`.slice(0, 80);
}

export function groupTimeline(
  years: WofYear[], events: WofEvent[], opts: { includeReview: boolean },
): WofYearGroup[] {
  const theme = new Map(years.map((y) => [y.year, y.theme]));
  const byYear = new Map<number, WofEvent[]>();
  for (const e of events) {
    if (e.needsReview && !opts.includeReview) continue;
    byYear.set(e.year, [...(byYear.get(e.year) ?? []), e]);
  }
  if (opts.includeReview) for (const y of years) if (!byYear.has(y.year)) byYear.set(y.year, []);
  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .filter(([, list]) => opts.includeReview || list.length > 0)
    .map(([year, list]) => ({
      year,
      theme: theme.get(year) ?? "",
      events: [...list].sort((a, b) =>
        a.sortDate === b.sortDate ? a.title.localeCompare(b.title) : a.sortDate < b.sortDate ? -1 : 1),
    }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all model tests PASS.

- [ ] **Step 5: Typecheck and commit**

Run: `npx tsc --noEmit 2>&1 | grep -E 'wall-of-faith|scripts/wof'` → no output.
```bash
git add src/lib/wall-of-faith/model.ts src/lib/wall-of-faith/model.test.ts
git commit -m "feat(wof): domain model, validation, slugs and timeline grouping"
```

---

### Task 3: Seed content and the SQL migration

**Files:**
- Create: `scripts/wof/seed.ts`, `scripts/wof/build-migration.ts`, `scripts/wof/build-migration.test.ts`
- Generate: `docs/superpowers/migrations/2026-11-06-wall-of-faith.sql`

**Interfaces:**
- Consumes: `slugify`, `eventInputSchema`, `yearInputSchema` from Task 2; `wallOfFaithEvents` from `src/data/wall-of-faith.ts` (still present until Task 7)
- Produces: `seedYears: WofYear[]`, `seedEvents(): EventInput[]` (`scripts/wof/seed.ts`); `sqlLiteral(v)`, `buildMigration(years, events): string` (`scripts/wof/build-migration.ts`)

- [ ] **Step 1: Re-read Margot's doc and diff against the override table below**

Fetch `1DuegjPVeApfrb-oipMHtSAqvqdkajL9y_dFLFmlaO9U` (part 5) as `dev.newseoulchurch@gmail.com` (`get_doc_as_markdown`). If any milestone or significance differs from `MARGOT` below, or new rows appear, update `MARGOT` / `ADDITIONS` to match her doc verbatim before continuing. Note the doc's last-edited time in the commit message.

- [ ] **Step 2: Draft the review-flagged additions**

Write the `ADDITIONS` drafts (titles, date labels, one- or two-sentence descriptions in the existing voice: plain past tense, "NSC …", no superlatives). Sources, in order:
- Drive folder names (date + title) for: Discipleship Sunday (2024-03-10), SolMen DT Phase 1 Cohort 2 (2024), DT Phase 1 Cohort 3 (2025), Baptism (2025-04-06), New Glow (2024-10-26).
- 2026: `~/chanos/workspaces/nsc/be-ready/` (HANDOFF.md, `vision/`, `recalibrate/`), `~/chanos/workspaces/nsc/dt/`, `~/chanos/workspaces/nsc/choir/`, `~/chanos/workspaces/nsc/lifegroup/` — only events that already happened (before 2026-11-06) plus any confirmed dated event; each must cite its source file in a `// src:` comment.
Every addition has `needsReview: true`. Unknown exact dates: `dateLabel` says what is known ("2024", "Spring 2025"); `sortDate` is the first day of that period.

- [ ] **Step 3: Write `scripts/wof/seed.ts`**

```ts
// scripts/wof/seed.ts — initial content for the wall_of_faith tables.
// Base = src/data/wall-of-faith.ts; MARGOT = her agenda-doc part 5; ADDITIONS = drafts (needs_review).
// Deleted after the migration is generated and committed (Task 7); the SQL file is the record.
import { wallOfFaithEvents } from "../../src/data/wall-of-faith.ts";
import { slugify, type EventInput, type WofYear } from "../../src/lib/wall-of-faith/model.ts";

export const seedYears: WofYear[] = [
  { year: 2023, theme: "Made New to Make New" },
  { year: 2024, theme: "Walking Toward the Call, Calling All Who Walk" },
  { year: 2025, theme: "Made for More" },
  { year: 2026, theme: "Be · Ready · Be Ready" },
];

// Key: `${year}|${title}|${date}` exactly as in src/data/wall-of-faith.ts.
type Override = { sortDate: string; title?: string; dateLabel?: string; milestone?: string; significance?: string };
export const OVERRIDES: Record<string, Override> = {
  "2023|Opening Prayer|Dec 2022 – May 14, 2023": { sortDate: "2022-12-01", milestone: "Prayer", significance: "Remembering that the church began in dependence on God and recognizing the vital role of intercessory prayer in building His community." },
  "2023|Commission Service|May 14, 2023": { sortDate: "2023-05-14", significance: "Celebrating God’s grace in establishing NSC and embracing His calling and mission together as a church." },
  "2023|Summer Night|July 2023": { sortDate: "2023-07-01", significance: "Nurturing friendship and a sense of belonging in Christ through shared joy and fellowship." },
  "2023|Forerunner Retreat|Aug 10–12, 2023": { sortDate: "2023-08-10", milestone: "Mt. Yongmun", significance: "Preparing hearts and lives to serve like Jesus and growing in dependence on God for the ministry entrusted to us." },
  "2023|Fall Festival|Sep 17, 2023": { sortDate: "2023-09-17", significance: "Expressing God’s love through hospitality, warmly welcoming newcomers and sharing food and joy together." },
  "2023|Chuseok Experience|Sep 30, 2023": { sortDate: "2023-09-30", significance: "Extending family-like hospitality to international students and practicing love for our neighbors across cultural differences." },
  "2023|DT Phase 1, Cohort 1|Oct 2023": { sortDate: "2023-10-01" },
  "2023|Thanksgiving|Nov 25, 2023": { sortDate: "2023-11-25", significance: "Giving thanks for God’s provision and celebrating our unity as one body in Christ through the sharing of cultures and food." },
  "2023|Christmas|Dec 25, 2023": { sortDate: "2023-12-25", milestone: "Family worship", significance: "Celebrating the love of Jesus, who came to dwell among us, and worshiping together as one family in Christ." },
  "2023|New Year Service|Jan 1, 2024": { sortDate: "2024-01-01", significance: "Thanking God for His guidance throughout the past year and entrusting the coming year to His faithfulness." },
  "2024|New Year Prayer Walk|Jan 2–5, 2024": { sortDate: "2024-01-02", significance: "Entrusting our steps in the new year to God and interceding for the city with a heart shaped by His love." },
  "2024|Life Group Olympic|Jan 28, 2024": { sortDate: "2024-01-28", significance: "Experiencing the joy and unity of being one body as members with different gifts cooperate and encourage one another." },
  "2024|Membership Class|Feb 4 & 18, 2024": { sortDate: "2024-02-04", significance: "Sharing in the church’s vision and faith, putting down roots in the community, and committing to love and serve one another faithfully." },
  "2024|Freedom Prayer Walk|Mar 1, 2024": { sortDate: "2024-03-01", significance: "Lifting the nation and city to God and praying for His peace, restoration, and true freedom to take root in this land." },
  "2024|Passion Week Early Morning Prayer|Mar 25–28, 2024": { sortDate: "2024-03-25", significance: "Offering the first moments of the day to God, reflecting on Jesus’ love and sacrifice on the cross, and responding in repentance and prayer." },
  "2024|Good Friday Service|Mar 29, 2024": { sortDate: "2024-03-29", milestone: "Washing feet", significance: "Learning from Jesus’ humility and service through foot washing, and remembering His saving sacrifice through the sharing of a Passover meal." },
  "2024|Easter Sunday|Mar 31, 2024": { sortDate: "2024-03-31", milestone: "Hope hunt", significance: "Celebrating Jesus’ resurrection and the joy of new life, and learning to see our everyday lives and city through the hope of the risen Christ." },
  "2024|DURE (두레) Fasting Retreat|Apr 10–13, 2024": { sortDate: "2024-04-10", milestone: "Clicker" },
  "2024|Breakthrough Retreat|May 10–12, 2024": { sortDate: "2024-05-10", milestone: "7hrs worship", significance: "Reflecting on God’s faithfulness in leading the church, sharing rest and fellowship, and renewing our calling as a community." },
  // "Early 2024": sort keeps its current position between Breakthrough and Sports Monster.
  "2024|DT Phase 2, Cohort 1|Early 2024": { sortDate: "2024-05-12" },
  "2024|Sports Monster Bungae (번개) Fellowship|May 15, 2024": { sortDate: "2024-05-15", title: "Sports Monster 1st Bungae (번개) Fellowship" },
  "2024|Mission Fair|Jun 9, 2024": { sortDate: "2024-06-09" },
  "2024|Palawan Mission|Jul 22–27, 2024": { sortDate: "2024-07-22", significance: "Partnering with local ministry workers to share the gospel in word and deed and participating in God’s love for all nations across cultures and borders." },
  "2024|Freedom Prayer Walk|Aug 14–15, 2024": { sortDate: "2024-08-14" },
  "2024|Haven Staff Retreat|Aug 23–24, 2024": { sortDate: "2024-08-23", milestone: "Camping" },
  "2024|Christmas Play|Dec 25, 2024": { sortDate: "2024-12-25", title: "Christmas", milestone: "Christmas play" },
  "2024|New Year Service|Dec 31, 2024": { sortDate: "2024-12-31" },
  "2025|Glory Retreat|Feb 7–9, 2025": { sortDate: "2025-02-07", milestone: "Ice bath" },
  "2025|NSB (New Seoul Basketball) Begins|Mar 13, 2025": { sortDate: "2025-03-13" },
  "2025|Town Hall Meeting|Apr 6, 2025": { sortDate: "2025-04-06" },
  "2025|Passion Week|Apr 14–17, 2025": { sortDate: "2025-04-14" },
  "2025|Easter Sunday|Apr 20, 2025": { sortDate: "2025-04-20", milestone: "Easter play" },
  "2025|ReadyCall|May 6, 2025": { sortDate: "2025-05-06" },
  "2025|2nd Year Anniversary|May 11, 2025": { sortDate: "2025-05-11" },
  "2025|Pray 4 Korea|Jun 4–8, 2025": { sortDate: "2025-06-04" },
  // "2025 (ongoing)": sort keeps its current position after Pray 4 Korea.
  "2025|Bungae Fellowship|2025 (ongoing)": { sortDate: "2025-06-20" },
  "2025|Indonesia Mission|Jun 30 – Jul 7, 2025": { sortDate: "2025-06-30", milestone: "Basketball" },
  "2025|Korea Mission|Jul 28 – Aug 1, 2025": { sortDate: "2025-07-28", milestone: "Sunduk Orphanage ministry" },
  "2025|NSK VBS (Vacation Bible School)|Jul 28 – Aug 1, 2025": { sortDate: "2025-08-09", dateLabel: "Aug 9–10, 2025", milestone: "Light" },
  "2025|Yongmun Mountain|Aug 15, 2025": { sortDate: "2025-08-15" },
  "2025|Journey Retreat|Oct 9–12, 2025": { sortDate: "2025-10-09", milestone: "Pilgrim’s progress" },
  "2025|Christmas Project|December 2025": { sortDate: "2025-12-01", milestone: "Guardians system for Sunduk Orphanage kids" },
  "2025|Christmas Film|Dec 25, 2025": { sortDate: "2025-12-25", title: "Christmas", milestone: "Christmas film" },
};

// Drafts from Step 2. Every entry needsReview: true. Shape:
export const ADDITIONS: Omit<EventInput, "slug" | "imageUrl" | "youtubeUrl" | "needsReview">[] = [
  { year: 2024, sortDate: "2024-10-26", dateLabel: "Oct 26, 2024", title: "New Glow", milestone: "Young people’s gathering", significance: null,
    description: "<Step 2 draft>" },
  // …Discipleship Sunday, SolMen DT Phase 1 Cohort 2, DT Phase 1 Cohort 3, Baptism, and 2026 entries from Step 2
];

export function seedEvents(): EventInput[] {
  const base = wallOfFaithEvents.map((e) => {
    const key = `${e.year}|${e.title}|${e.date}`;
    const o = OVERRIDES[key];
    if (!o) throw new Error(`no override for ${key}`);
    return {
      slug: e.id, year: e.year, sortDate: o.sortDate, dateLabel: o.dateLabel ?? e.date,
      title: o.title ?? e.title, description: e.description, milestone: o.milestone ?? null,
      significance: o.significance ?? null, imageUrl: null, youtubeUrl: e.youtubeUrl, needsReview: false,
    } satisfies EventInput;
  });
  const added = ADDITIONS.map((a) => ({ ...a, slug: slugify(a.year, a.title), imageUrl: null, youtubeUrl: null, needsReview: true }));
  return [...base, ...added];
}
```
The `"<Step 2 draft>"` strings are filled with the Step 2 text before Step 6; the test in Step 4 fails while any remain.

- [ ] **Step 4: Write the failing migration tests**

```ts
// scripts/wof/build-migration.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { sqlLiteral, buildMigration } from "./build-migration.ts";
import { seedYears, seedEvents, OVERRIDES } from "./seed.ts";
import { wallOfFaithEvents } from "../../src/data/wall-of-faith.ts";
import { eventInputSchema } from "../../src/lib/wall-of-faith/model.ts";

test("sqlLiteral escapes and types values", () => {
  assert.equal(sqlLiteral("God’s 'grace'"), "'God’s ''grace'''");
  assert.equal(sqlLiteral(null), "null");
  assert.equal(sqlLiteral(true), "true");
  assert.equal(sqlLiteral(2024), "2024");
});

test("every current event has an override, and no override is orphaned", () => {
  const keys = new Set(wallOfFaithEvents.map((e) => `${e.year}|${e.title}|${e.date}`));
  for (const k of Object.keys(OVERRIDES)) assert.ok(keys.has(k), `orphan override ${k}`);
  assert.equal(keys.size, Object.keys(OVERRIDES).length);
});

test("seed events are valid, slugs unique, years exist, no draft placeholders", () => {
  const events = seedEvents();
  const years = new Set(seedYears.map((y) => y.year));
  const slugs = new Set<string>();
  for (const e of events) {
    eventInputSchema.parse(e);
    assert.ok(!slugs.has(e.slug), `duplicate slug ${e.slug}`); slugs.add(e.slug);
    assert.ok(years.has(e.year), `no year row for ${e.year}`);
    assert.ok(!e.description.includes("<Step 2"), `undrafted ${e.slug}`);
  }
});

test("corrections from Margot and Drive are applied", () => {
  const bySlugTitle = (t: string, y: number) => seedEvents().find((e) => e.title === t && e.year === y)!;
  assert.equal(bySlugTitle("NSK VBS (Vacation Bible School)", 2025).sortDate, "2025-08-09");
  assert.equal(bySlugTitle("NSK VBS (Vacation Bible School)", 2025).dateLabel, "Aug 9–10, 2025");
  assert.equal(seedEvents().filter((e) => e.title === "Christmas").length >= 3, true);
  assert.equal(bySlugTitle("New Glow", 2024).needsReview, true);
  assert.ok(seedEvents().filter((e) => e.year === 2026).every((e) => e.needsReview));
});

test("buildMigration creates both tables, enables RLS, inserts every row", () => {
  const sql = buildMigration(seedYears, seedEvents());
  assert.match(sql, /create table wall_of_faith_years/);
  assert.match(sql, /create table wall_of_faith_events/);
  assert.match(sql, /alter table wall_of_faith_events enable row level security/);
  assert.equal((sql.match(/^\s*\('/gm) ?? []).length + (sql.match(/^\s*\(\d{4},/gm) ?? []).length,
    seedEvents().length + seedYears.length);
});
```

- [ ] **Step 5: Run to verify failure**

Run: `npm test` → FAIL (`build-migration.ts` missing).

- [ ] **Step 6: Implement `scripts/wof/build-migration.ts`**

```ts
// scripts/wof/build-migration.ts — run: node scripts/wof/build-migration.ts
import { writeFileSync } from "node:fs";
import type { EventInput, WofYear } from "../../src/lib/wall-of-faith/model.ts";
import { toRowValues } from "../../src/lib/wall-of-faith/model.ts";

export function sqlLiteral(v: string | number | boolean | null): string {
  if (v === null) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return `'${v.replace(/'/g, "''")}'`;
}

const COLS = ["slug", "year", "sort_date", "date_label", "title", "description", "milestone",
  "significance", "image_url", "youtube_url", "needs_review"] as const;

export function buildMigration(years: WofYear[], events: EventInput[]): string {
  const yearRows = years.map((y) => `  (${y.year}, ${sqlLiteral(y.theme)})`).join(",\n");
  const eventRows = events.map((e) => {
    const r = toRowValues(e) as Record<string, string | number | boolean | null>;
    return `  (${COLS.map((c) => sqlLiteral(r[c] ?? null)).join(", ")})`;
  }).join(",\n");
  return `-- Wall of Faith tables + seed (generated by scripts/wof/build-migration.ts, 2026-11-06).
-- Run once in the Supabase SQL editor. A second run fails on "create table": expected.

create table wall_of_faith_years (
  year  int primary key,
  theme text not null
);

create table wall_of_faith_events (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  year          int  not null references wall_of_faith_years(year),
  sort_date     date not null,
  date_label    text not null,
  title         text not null,
  description   text not null default '',
  milestone     text,
  significance  text,
  image_url     text,
  youtube_url   text,
  needs_review  boolean not null default false,
  updated_at    timestamptz not null default now()
);

create index wall_of_faith_events_order on wall_of_faith_events (year, sort_date, title);

alter table wall_of_faith_years enable row level security;
alter table wall_of_faith_events enable row level security;

insert into wall_of_faith_years (year, theme) values
${yearRows};

insert into wall_of_faith_events (${COLS.join(", ")}) values
${eventRows};
`;
}

if (import.meta.main) {
  const { seedYears, seedEvents } = await import("./seed.ts");
  const out = "docs/superpowers/migrations/2026-11-06-wall-of-faith.sql";
  writeFileSync(out, buildMigration(seedYears, seedEvents()));
  console.log(`wrote ${out}`);
}
```

- [ ] **Step 7: Run tests, then generate**

Run: `npm test` → PASS. Then `node scripts/wof/build-migration.ts` → `wrote docs/superpowers/migrations/2026-11-06-wall-of-faith.sql`.
Check: `grep -c "^  ('" docs/superpowers/migrations/2026-11-06-wall-of-faith.sql` equals the event count printed by `node -e` on `seedEvents().length`.

- [ ] **Step 8: Chan reviews drafts, then runs the migration**

Show Chan: the list of `needs_review` rows (title, date label, description) and the three tags to confirm ("Clicker", "Light", "Basketball"). Apply his edits to `seed.ts`, regenerate. Then Chan runs the SQL in Supabase → SQL editor (production). Verify via the Supabase MCP or a Node one-liner using `.env.local`: `select count(*) from wall_of_faith_events` equals the seed count; `select count(*) from wall_of_faith_years` = 4.
Requires `.env.local` restored (Chan, from Vercel dashboard `nscs-projects/nsc-web` → Settings → Environment Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BLOB_READ_WRITE_TOKEN`, plus the rest the app needs to boot).

- [ ] **Step 9: Commit**

```bash
git add scripts/wof/seed.ts scripts/wof/build-migration.ts scripts/wof/build-migration.test.ts docs/superpowers/migrations/2026-11-06-wall-of-faith.sql
git commit -m "feat(wof): seed content (Margot's milestones, drafts flagged) and migration"
```

---

### Task 4: Loader, server helpers and API routes

**Files:**
- Create: `src/lib/wall-of-faith/load.ts`, `src/lib/wall-of-faith/server.ts`
- Create: `src/app/api/wall-of-faith/events/route.ts`, `src/app/api/wall-of-faith/events/[id]/route.ts`, `src/app/api/wall-of-faith/upload/route.ts`, `src/app/api/wall-of-faith/years/route.ts`

**Interfaces:**
- Consumes: Task 2 model.
- Produces:
  - `loadWallOfFaith(db: SupabaseClient, opts: { includeReview: boolean }): Promise<WofYearGroup[]>`
  - `loadAdminData(db): Promise<{ years: WofYear[]; events: WofEvent[] }>`
  - `adminDb(): SupabaseClient`; `requireAdmin(): Promise<NextResponse | null>` (returns a 401 response or null)
  - Routes: `POST /api/wall-of-faith/events` body `EventInput` (slug optional → `slugify`) → `{ event: WofEvent }` 201 | 400 | 409 duplicate slug; `PATCH /api/wall-of-faith/events/[id]` body `EventPatch` → `{ event }`; `DELETE` → `{ ok: true }`; `POST /api/wall-of-faith/upload` form-data `file` (+ optional `eventId`) → `{ url }`; `PUT /api/wall-of-faith/years` body `{ year, theme }` → `{ year }`.

- [ ] **Step 1: Write `load.ts` and `server.ts`**

```ts
// src/lib/wall-of-faith/load.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { fromRow, groupTimeline, WOF_EVENT_COLUMNS, type WofRow, type WofYear, type WofEvent, type WofYearGroup } from "./model";

export async function loadAdminData(db: SupabaseClient): Promise<{ years: WofYear[]; events: WofEvent[] }> {
  const [y, e] = await Promise.all([
    db.from("wall_of_faith_years").select("year, theme").order("year"),
    db.from("wall_of_faith_events").select(WOF_EVENT_COLUMNS).order("year").order("sort_date").order("title"),
  ]);
  if (y.error) throw new Error(`wall_of_faith_years: ${y.error.message}`);
  if (e.error) throw new Error(`wall_of_faith_events: ${e.error.message}`);
  return { years: y.data as WofYear[], events: (e.data as WofRow[]).map(fromRow) };
}

export async function loadWallOfFaith(db: SupabaseClient, opts: { includeReview: boolean }): Promise<WofYearGroup[]> {
  const { years, events } = await loadAdminData(db);
  return groupTimeline(years, events, opts);
}
```
Errors throw (unlike `loadBoard`), so a broken query renders Next's error page instead of an empty wall.

```ts
// src/lib/wall-of-faith/server.ts
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export function adminDb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies();
  return store.get("adminToken")?.value ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function badRequest(error: unknown) {
  return NextResponse.json({ error: typeof error === "string" ? error : "Invalid input", issues: error }, { status: 400 });
}
```

- [ ] **Step 2: Events create route**

```ts
// src/app/api/wall-of-faith/events/route.ts
import { NextResponse } from "next/server";
import { adminDb, requireAdmin, badRequest } from "@/lib/wall-of-faith/server";
import { eventInputSchema, fromRow, slugify, toRowValues, WOF_EVENT_COLUMNS, type WofRow } from "@/lib/wall-of-faith/model";

export async function POST(request: Request) {
  const denied = await requireAdmin(); if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return badRequest("Body must be JSON");
  const withSlug = { ...body, slug: body.slug || slugify(Number(body.year), String(body.title ?? "")) };
  const parsed = eventInputSchema.safeParse(withSlug);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const db = adminDb();
  const { data: year } = await db.from("wall_of_faith_years").select("year").eq("year", parsed.data.year).maybeSingle();
  if (!year) return badRequest(`Year ${parsed.data.year} has no theme row; add the year first`);

  const { data, error } = await db.from("wall_of_faith_events").insert(toRowValues(parsed.data)).select(WOF_EVENT_COLUMNS).single();
  if (error?.code === "23505") return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: fromRow(data as WofRow) }, { status: 201 });
}
```

- [ ] **Step 3: Event update/delete route**

```ts
// src/app/api/wall-of-faith/events/[id]/route.ts
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { adminDb, requireAdmin, badRequest, UUID_RE } from "@/lib/wall-of-faith/server";
import { eventPatchSchema, fromRow, toRowPatch, WOF_EVENT_COLUMNS, type WofRow } from "@/lib/wall-of-faith/model";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const denied = await requireAdmin(); if (denied) return denied;
  const { id } = await params;
  if (!UUID_RE.test(id)) return badRequest("Invalid id");
  const parsed = eventPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const db = adminDb();
  const { data, error } = await db.from("wall_of_faith_events")
    .update({ ...toRowPatch(parsed.data), updated_at: new Date().toISOString() })
    .eq("id", id).select(WOF_EVENT_COLUMNS).maybeSingle();
  if (error?.code === "23505") return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  if (error?.code === "23503") return badRequest("That year has no theme row");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event: fromRow(data as WofRow) });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const denied = await requireAdmin(); if (denied) return denied;
  const { id } = await params;
  if (!UUID_RE.test(id)) return badRequest("Invalid id");
  const { data, error } = await adminDb().from("wall_of_faith_events").delete().eq("id", id).select("image_url").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (data.image_url?.includes(".blob.vercel-storage.com/")) await del(data.image_url).catch(() => {});
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Upload route — new blob first, row second, old blob last**

```ts
// src/app/api/wall-of-faith/upload/route.ts
import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { adminDb, requireAdmin, badRequest, UUID_RE } from "@/lib/wall-of-faith/server";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const denied = await requireAdmin(); if (denied) return denied;
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
  const { error } = await db.from("wall_of_faith_events")
    .update({ image_url: blob.url, updated_at: new Date().toISOString() }).eq("id", eventId);
  if (error) {
    await del(blob.url).catch(() => {});          // keep the old photo; drop the orphan
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (before?.image_url && before.image_url !== blob.url && before.image_url.includes(".blob.vercel-storage.com/")) {
    await del(before.image_url).catch(() => {});
  }
  return NextResponse.json({ url: blob.url });
}
```

- [ ] **Step 5: Years route**

```ts
// src/app/api/wall-of-faith/years/route.ts
import { NextResponse } from "next/server";
import { adminDb, requireAdmin, badRequest } from "@/lib/wall-of-faith/server";
import { yearInputSchema } from "@/lib/wall-of-faith/model";

export async function PUT(request: Request) {
  const denied = await requireAdmin(); if (denied) return denied;
  const parsed = yearInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.flatten());
  const { data, error } = await adminDb().from("wall_of_faith_years").upsert(parsed.data).select("year, theme").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ year: data });
}
```

- [ ] **Step 6: Exercise the routes against production with review-flagged data**

Start the dev server. In Playwright (`page.evaluate(fetch…)`, since a hook blocks curl), without the cookie: each route → 401. With `adminToken=mock-admin-token` cookie:
1. `POST /events` `{year:2026, sortDate:"2026-01-01", dateLabel:"TEST", title:"ZZ test row", description:"", needsReview:true}` → 201, slug `2026-zz-test-row`.
2. Same again → 409.
3. `PATCH` with `{title:""}` → 400; `{youtubeUrl:"http://x"}` → 400; `{milestone:"ok"}` → 200.
4. `POST /upload` with a 10 KB JPEG and `eventId` → 200; row `image_url` set. Upload a second JPEG → new one 200; old blob gone (`list({ prefix: "wall-of-faith/" })` from `@vercel/blob` no longer has it — a plain fetch of the old URL can still hit the CDN cache for a minute).
5. `POST /upload` with a `.gif` → 400.
6. `PUT /years` `{year:2026, theme:""}` → 400; with the real 2026 theme → 200.
7. `DELETE` the row → 200; its blob URL 404s; a second DELETE → 404.
Expected: all as listed; the public `/wall-of-faith` never shows "ZZ test row".

- [ ] **Step 7: Typecheck and commit**

```bash
git add src/lib/wall-of-faith/load.ts src/lib/wall-of-faith/server.ts src/app/api/wall-of-faith
git commit -m "feat(wof): loader and admin API (events, upload, years)"
```

---

### Task 5: Admin UI

**Files:**
- Modify (replace): `src/app/admin/wall-of-faith/page.tsx`
- Create: `src/components/wall-of-faith/admin/WofAdmin.tsx`, `EventForm.tsx`, `compressImage.ts`

**Interfaces:**
- Consumes: `loadAdminData`, `adminDb` (server page); routes from Task 4; `WofEvent`, `WofYear`, `slugify`.
- Produces: `<WofAdmin initialYears={WofYear[]} initialEvents={WofEvent[]} />`; `<EventForm event?: WofEvent; years: WofYear[]; onSaved(e: WofEvent): void; onDeleted(id: string): void; onClose(): void />`; `compressImage(file: File): Promise<File>`

- [ ] **Step 1: Server page**

```tsx
// src/app/admin/wall-of-faith/page.tsx
import WofAdmin from "@/components/wall-of-faith/admin/WofAdmin";
import { loadAdminData } from "@/lib/wall-of-faith/load";
import { adminDb } from "@/lib/wall-of-faith/server";

export const dynamic = "force-dynamic";

export default async function WallOfFaithAdminPage() {
  const { years, events } = await loadAdminData(adminDb());
  return (
    <div className="px-4 sm:px-8 py-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-widest uppercase mb-6">Wall of Faith 관리</h1>
      <WofAdmin initialYears={years} initialEvents={events} />
    </div>
  );
}
```

- [ ] **Step 2: Image compression**

```ts
// src/components/wall-of-faith/admin/compressImage.ts
// Downscale to ≤1600px on the long edge and re-encode as JPEG, stepping quality down to ~500KB.
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 업로드할 수 있습니다.");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  for (const q of [0.85, 0.75, 0.65, 0.55]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && (blob.size <= 500 * 1024 || q === 0.55)) {
      return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    }
  }
  throw new Error("이미지를 처리하지 못했습니다.");
}
```
Canvas re-encoding drops EXIF, so admin uploads carry no GPS either.

- [ ] **Step 3: EventForm**

```tsx
// src/components/wall-of-faith/admin/EventForm.tsx
"use client";
import { useState } from "react";
import type { WofEvent, WofYear } from "@/lib/wall-of-faith/model";
import { compressImage } from "./compressImage";

type Props = {
  event?: WofEvent; years: WofYear[];
  onSaved: (e: WofEvent) => void; onDeleted: (id: string) => void; onClose: () => void;
};

const blank = (year: number): Omit<WofEvent, "id"> => ({
  slug: "", year, sortDate: `${year}-01-01`, dateLabel: "", title: "", description: "",
  milestone: null, significance: null, imageUrl: null, youtubeUrl: null, needsReview: true,
});

export default function EventForm({ event, years, onSaved, onDeleted, onClose }: Props) {
  const [f, setF] = useState<Omit<WofEvent, "id">>(event ?? blank(years.at(-1)?.year ?? new Date().getFullYear()));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true); setErr(null);
    try {
      const { imageUrl: _ignored, ...fields } = f;
      const body = { ...fields, slug: event ? f.slug : "" };
      const res = await fetch(event ? `/api/wall-of-faith/events/${event.id}` : "/api/wall-of-faith/events", {
        method: event ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "저장 실패");
      let saved: WofEvent = json.event;
      if (file) {
        const fd = new FormData();
        fd.append("file", await compressImage(file));
        fd.append("eventId", saved.id);
        const up = await fetch("/api/wall-of-faith/upload", { method: "POST", body: fd });
        const upJson = await up.json();
        if (!up.ok) throw new Error(`글은 저장됨, 사진 실패: ${upJson.error}`);
        saved = { ...saved, imageUrl: upJson.url };
      }
      onSaved(saved);
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!event || !confirm(`"${event.title}" 삭제할까요? 사진도 함께 삭제됩니다.`)) return;
    setBusy(true);
    const res = await fetch(`/api/wall-of-faith/events/${event.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) onDeleted(event.id); else setErr((await res.json()).error ?? "삭제 실패");
  }

  const input = "w-full border rounded px-2 py-1.5 text-sm";
  const label = "block text-xs font-semibold text-gray-500 mb-1";
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-xl p-5 space-y-3 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold">{event ? "이벤트 수정" : "이벤트 추가"}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><span className={label}>Year</span>
            <select className={input} value={f.year} onChange={(e) => set("year", Number(e.target.value))}>
              {years.map((y) => <option key={y.year} value={y.year}>{y.year}</option>)}
            </select></div>
          <div><span className={label}>Sort date</span>
            <input type="date" className={input} value={f.sortDate} onChange={(e) => set("sortDate", e.target.value)} /></div>
        </div>
        <div><span className={label}>Date label (shown)</span>
          <input className={input} maxLength={60} value={f.dateLabel} onChange={(e) => set("dateLabel", e.target.value)} placeholder="Mar 25–28, 2024" /></div>
        <div><span className={label}>Title</span>
          <input className={input} maxLength={120} value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div><span className={label}>Description ({f.description.length}/1000)</span>
          <textarea className={input} rows={3} maxLength={1000} value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div><span className={label}>Spiritual milestone (badge)</span>
          <input className={input} maxLength={60} value={f.milestone ?? ""} onChange={(e) => set("milestone", e.target.value || null)} /></div>
        <div><span className={label}>Spiritual significance ({(f.significance ?? "").length}/400)</span>
          <textarea className={input} rows={2} maxLength={400} value={f.significance ?? ""} onChange={(e) => set("significance", e.target.value || null)} /></div>
        <div><span className={label}>YouTube URL</span>
          <input className={input} value={f.youtubeUrl ?? ""} onChange={(e) => set("youtubeUrl", e.target.value || null)} /></div>
        <div><span className={label}>Photo</span>
          {f.imageUrl && !file && <img src={f.imageUrl} alt="" className="w-24 h-24 object-cover rounded mb-2" />}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.needsReview} onChange={(e) => set("needsReview", e.target.checked)} />
          Needs review (hidden from the public page)
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-between pt-2">
          {event ? <button className="text-sm text-red-600" disabled={busy} onClick={remove}>삭제</button> : <span />}
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm border rounded" onClick={onClose} disabled={busy}>취소</button>
            <button className="px-3 py-1.5 text-sm rounded bg-black text-white disabled:opacity-50" onClick={save} disabled={busy}>
              {busy ? "저장 중…" : "저장"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: WofAdmin list, filter and year themes**

```tsx
// src/components/wall-of-faith/admin/WofAdmin.tsx
"use client";
import { useMemo, useState } from "react";
import type { WofEvent, WofYear } from "@/lib/wall-of-faith/model";
import { groupTimeline } from "@/lib/wall-of-faith/model";
import EventForm from "./EventForm";

export default function WofAdmin({ initialYears, initialEvents }: { initialYears: WofYear[]; initialEvents: WofEvent[] }) {
  const [years, setYears] = useState(initialYears);
  const [events, setEvents] = useState(initialEvents);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [editing, setEditing] = useState<WofEvent | "new" | null>(null);
  const [newYear, setNewYear] = useState({ year: "", theme: "" });
  const [yearMsg, setYearMsg] = useState<string | null>(null);

  const reviewCount = events.filter((e) => e.needsReview).length;
  const groups = useMemo(
    () => groupTimeline(years, reviewOnly ? events.filter((e) => e.needsReview) : events, { includeReview: true })
      .filter((g) => !reviewOnly || g.events.length > 0),
    [years, events, reviewOnly]);

  async function saveYear(year: number, theme: string) {
    setYearMsg(null);
    const res = await fetch("/api/wall-of-faith/years", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year, theme }) });
    const json = await res.json();
    if (!res.ok) { setYearMsg(json.error ?? "저장 실패"); return; }
    setYears((ys) => [...ys.filter((y) => y.year !== year), json.year].sort((a, b) => a.year - b.year));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button className="px-3 py-1.5 text-sm rounded bg-black text-white" onClick={() => setEditing("new")}>+ 이벤트 추가</button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={reviewOnly} onChange={(e) => setReviewOnly(e.target.checked)} />
          Needs review only <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">{reviewCount}</span>
        </label>
      </div>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-semibold">Year themes</h2>
        {years.map((y) => (
          <form key={y.year} className="flex gap-2 items-center" onSubmit={(e) => { e.preventDefault(); saveYear(y.year, (e.currentTarget.elements.namedItem("theme") as HTMLInputElement).value); }}>
            <span className="w-12 text-sm font-semibold">{y.year}</span>
            <input name="theme" defaultValue={y.theme} maxLength={120} className="flex-1 border rounded px-2 py-1 text-sm" />
            <button className="text-xs border rounded px-2 py-1">저장</button>
          </form>
        ))}
        <form className="flex gap-2 items-center pt-2 border-t" onSubmit={(e) => { e.preventDefault(); saveYear(Number(newYear.year), newYear.theme).then(() => setNewYear({ year: "", theme: "" })); }}>
          <input placeholder="Year" value={newYear.year} onChange={(e) => setNewYear({ ...newYear, year: e.target.value })} className="w-20 border rounded px-2 py-1 text-sm" />
          <input placeholder="Theme" value={newYear.theme} onChange={(e) => setNewYear({ ...newYear, theme: e.target.value })} className="flex-1 border rounded px-2 py-1 text-sm" />
          <button className="text-xs border rounded px-2 py-1">연도 추가</button>
        </form>
        {yearMsg && <p className="text-sm text-red-600">{yearMsg}</p>}
      </section>

      {groups.map((g) => (
        <section key={g.year}>
          <h2 className="text-lg font-bold mb-2">{g.year} <span className="text-sm font-normal text-gray-500">{g.theme}</span></h2>
          <ul className="divide-y border rounded-lg">
            {g.events.length === 0 && <li className="p-3 text-sm text-gray-400">No events</li>}
            {g.events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer" onClick={() => setEditing(e)}>
                {e.imageUrl ? <img src={e.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
                  : <div className="w-12 h-12 rounded bg-[#e8dccb]" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">{e.dateLabel}</p>
                  <p className="font-semibold truncate">{e.title}</p>
                  {e.milestone && <p className="text-xs text-[#8b7355]">✦ {e.milestone}</p>}
                </div>
                {e.needsReview && <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">Needs review</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {editing && (
        <EventForm
          event={editing === "new" ? undefined : editing} years={years}
          onClose={() => setEditing(null)}
          onSaved={(saved) => { setEvents((es) => [...es.filter((x) => x.id !== saved.id), saved]); setEditing(null); }}
          onDeleted={(id) => { setEvents((es) => es.filter((x) => x.id !== id)); setEditing(null); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify in the browser (production DB, review-flagged row only)**

With the admin cookie at `http://localhost:3001/admin/wall-of-faith`:
1. All seeded years and events listed; the review count matches the number of drafts.
2. "Needs review only" shows only drafts; years with none are hidden.
3. Add an event "ZZ admin test" in 2026 with a photo → appears with thumb and "Needs review" chip.
4. Edit its milestone; reopen → persisted after reload.
5. Replace its photo → new thumb; old blob URL returns 404.
6. Save with an empty title → red error, nothing lost.
7. Delete → gone after reload; its blob 404s.
8. Public `/wall-of-faith` never shows "ZZ admin test".
9. Phone width (390): list and form usable, no horizontal scroll.

- [ ] **Step 6: Typecheck and commit**

```bash
git add src/app/admin/wall-of-faith/page.tsx src/components/wall-of-faith/admin
git commit -m "feat(wof): admin CRUD with photo upload, review filter and year themes"
```

---

### Task 6: Shared display components

**Files:**
- Create: `src/components/wall-of-faith/EventPhoto.tsx`, `src/components/wall-of-faith/MilestoneBadge.tsx`
- Modify: `next.config.ts` (move to `remotePatterns`, keep existing hosts)

**Interfaces:**
- Produces: `<EventPhoto event={WofEvent} sizes={string} className?={string} rounded?={"none" | "full"} />` — renders inside a positioned, sized parent (uses `fill`); `<MilestoneBadge text={string} />`

- [ ] **Step 1: next.config images → remotePatterns (any Blob store host)**

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "i.ytimg.com" },
    { protocol: "https", hostname: "img.youtube.com" },
    { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
  ],
},
```
Check: bulletin and events images still load on `/bulletin` and `/` locally.

- [ ] **Step 2: Components**

```tsx
// src/components/wall-of-faith/EventPhoto.tsx
import Image from "next/image";
import type { WofEvent } from "@/lib/wall-of-faith/model";

type Props = { event: WofEvent; sizes: string; className?: string; rounded?: "none" | "full" };

export default function EventPhoto({ event, sizes, className = "", rounded = "none" }: Props) {
  const shape = rounded === "full" ? "rounded-full" : "";
  if (!event.imageUrl) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center p-3 text-center bg-gradient-to-br from-[#d9c9b0] to-[#efe4d3] ${shape} ${className}`}>
        <span className="text-[#8b7355] text-xs sm:text-sm font-semibold italic leading-snug line-clamp-3">{event.title}</span>
      </div>
    );
  }
  return <Image src={event.imageUrl} alt={event.title} fill sizes={sizes} className={`object-cover ${shape} ${className}`} />;
}
```

```tsx
// src/components/wall-of-faith/MilestoneBadge.tsx
export default function MilestoneBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#d9c9b0] bg-[#fffaf4] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#8b7355] max-w-full break-words">
      <span aria-hidden>✦</span>{text}
    </span>
  );
}
```

- [ ] **Step 3: Typecheck and commit**

```bash
git add next.config.ts src/components/wall-of-faith/EventPhoto.tsx src/components/wall-of-faith/MilestoneBadge.tsx
git commit -m "feat(wof): shared EventPhoto (titled placeholder) and MilestoneBadge"
```

---

### Task 7: Scrapbook on the database; retire the hardcoded data

**Files:**
- Modify: `src/app/wall-of-faith/page.tsx`, `src/components/wall-of-faith/YearSection.tsx`, `src/components/wall-of-faith/PolaroidCard.tsx`
- Delete: `src/data/wall-of-faith.ts`, `scripts/wof/seed.ts`, `scripts/wof/build-migration.ts`, `scripts/wof/build-migration.test.ts`

**Interfaces:**
- Consumes: `loadWallOfFaith`, `adminDb`, `EventPhoto`, `MilestoneBadge`, `WofEvent`, `WofYearGroup`.
- Produces: `YearSection({ group: WofYearGroup })`, `PolaroidCard({ event: WofEvent; index: number })`.

- [ ] **Step 1: Page**

```tsx
// src/app/wall-of-faith/page.tsx
import { Metadata } from "next";
import YearSection from "@/components/wall-of-faith/YearSection";
import { loadWallOfFaith } from "@/lib/wall-of-faith/load";
import { adminDb } from "@/lib/wall-of-faith/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Wall of Faith",
  description: "Every step of NSC's journey — from our first gathering to today.",
};

export default async function WallOfFaithPage() {
  const groups = await loadWallOfFaith(adminDb(), { includeReview: false });
  return (
    <div className="px-4 sm:px-[85px]">
      <section className="mt-[64px] sm:mt-[104px] py-[24px] sm:py-[31px] text-center">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">WALL OF FAITH</h1>
        <p className="mt-4 text-base sm:text-lg text-gray-500">Every step of the journey.</p>
      </section>
      <div className="rounded-[18px] px-4 sm:px-12 py-8 mt-8 mb-[64px] sm:mb-[97px]" style={{ background: "#f5ede0" }}>
        {groups.map((g) => <YearSection key={g.year} group={g} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: YearSection** — same markup as today, with these changes: props `{ group }`; `event.date` → `event.dateLabel`; add above the `<h3>`: `{event.milestone && <div className="mb-2"><MilestoneBadge text={event.milestone} /></div>}`; add after the description `<p>`: `{event.significance && <p className="mt-3 text-base italic text-[#8b7355] leading-relaxed">{event.significance}</p>}`; wrap the text column in `min-w-0 break-words`. Full file:

```tsx
// src/components/wall-of-faith/YearSection.tsx
import type { WofYearGroup } from "@/lib/wall-of-faith/model";
import MilestoneBadge from "./MilestoneBadge";
import PolaroidCard from "./PolaroidCard";

export default function YearSection({ group }: { group: WofYearGroup }) {
  const { year, theme, events } = group;
  return (
    <section className="mb-20">
      <div className="flex flex-col items-center my-12 gap-2">
        <div className="relative flex items-center justify-center w-full">
          <div className="absolute inset-x-0 h-px bg-[#d9c9b0]" />
          <span className="relative bg-[#f5ede0] px-6 text-4xl font-black italic tracking-[8px] text-[#8b7355] opacity-60 select-none">{year}</span>
        </div>
        {theme && <p className="text-sm uppercase tracking-[3px] text-[#a0896a] font-semibold text-center">{theme}</p>}
      </div>
      <div className="flex flex-col gap-16">
        {events.map((event, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div key={event.id} className={`flex flex-col items-center gap-8 sm:gap-12 ${isLeft ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
              <div className="flex justify-center"><PolaroidCard event={event} index={i} /></div>
              <div className={`flex-1 min-w-0 break-words ${isLeft ? "text-left" : "sm:text-right text-left"}`}>
                <p className="text-sm text-[#a0896a] uppercase tracking-widest mb-2">{event.dateLabel}</p>
                {event.milestone && <div className="mb-2"><MilestoneBadge text={event.milestone} /></div>}
                <h3 className="text-2xl font-black text-[#3d2f1e] mb-3 leading-tight">{event.title}</h3>
                <p className="text-base text-[#6b5540] leading-relaxed">{event.description}</p>
                {event.significance && <p className="mt-3 text-base italic text-[#8b7355] leading-relaxed">{event.significance}</p>}
                {event.youtubeUrl && (
                  <a href={event.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm font-bold text-[#cc0000] hover:underline">▶ Watch on YouTube</a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: PolaroidCard** — change the import to `import type { WofEvent } from "@/lib/wall-of-faith/model"` and `import EventPhoto from "./EventPhoto"`; type the prop as `WofEvent`; replace the TODO gradient `<div>` with `<div style={{ position: "relative", width: "100%", aspectRatio: "1" }}><EventPhoto event={event} sizes="(max-width: 640px) 220px, 260px" /></div>`; `event.date` → `event.dateLabel`; on the back, insert `{event.milestone && <p style={{ fontSize: "10px", color: "#8b7355", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", flexShrink: 0 }}>✦ {event.milestone}</p>}` above the `<h3>`.

- [ ] **Step 4: Delete the hardcoded data and seed scripts**

```bash
git rm src/data/wall-of-faith.ts scripts/wof/seed.ts scripts/wof/build-migration.ts scripts/wof/build-migration.test.ts
grep -rn "data/wall-of-faith" src scripts   # expect nothing
```
The committed SQL in `docs/superpowers/migrations/` is the record of the seed.

- [ ] **Step 5: Verify (Review Focus 1, 2, 5)**

Playwright at 1280 and 390:
1. Years 2023–2025 render; 2026 absent while all its rows are `needs_review` (no empty band).
2. Events with no photo show the titled placeholder; with photo, the image (after Task 9; before that, all placeholders).
3. Good Friday shows "✦ Washing feet" and its significance in italics; Mission Fair shows neither.
4. No "needs review" draft visible (pick one draft title and search page text).
5. Create a temporary review-flagged row with a 1000-char description, 400-char significance and 60-char milestone; flip it to `needs_review=false` for the check only; at 390 px `document.documentElement.scrollWidth === 390`; then delete it.
6. `npm test` still passes (model tests).

- [ ] **Step 6: Typecheck and commit**

```bash
git add -A src/app/wall-of-faith src/components/wall-of-faith/YearSection.tsx src/components/wall-of-faith/PolaroidCard.tsx
git commit -m "feat(wof): scrapbook reads Supabase, shows milestones; retire hardcoded data"
```

---

### Task 8: Circle spine design (`/wall-of-faith-2`)

Reference: vault `NSC Website/.playwright-mcp/page-2026-06-02T04-07-38-196Z.jpeg` (collapsed), `…04-09-09-596Z.jpeg` and `…04-09-20-865Z.jpeg` (expanded card). Colors and type follow the scrapbook palette (`#8b7355`, `#a0896a`, `#d9c9b0`, `#3d2f1e`, `#6b5540`, `#fffaf4`).

**Files:**
- Create: `src/app/wall-of-faith-2/page.tsx`, `src/components/wall-of-faith/spine/SpineTimeline.tsx`, `SpineYear.tsx`, `SpineNode.tsx`, `SpineDetail.tsx`

**Interfaces:**
- Consumes: `loadWallOfFaith`, `adminDb`, `EventPhoto`, `MilestoneBadge`, `WofYearGroup`, `WofEvent`.
- Produces: `<SpineTimeline groups={WofYearGroup[]} />` (client; owns `openId: string | null`); `<SpineYear group openId onToggle(id) />`; `<SpineNode event side: "left" | "right" open onToggle />`; `<SpineDetail event />`.

- [ ] **Step 1: Page**

```tsx
// src/app/wall-of-faith-2/page.tsx
import { Metadata } from "next";
import SpineTimeline from "@/components/wall-of-faith/spine/SpineTimeline";
import { loadWallOfFaith } from "@/lib/wall-of-faith/load";
import { adminDb } from "@/lib/wall-of-faith/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wall of Faith", robots: { index: false } };

export default async function WallOfFaithSpinePage() {
  const groups = await loadWallOfFaith(adminDb(), { includeReview: false });
  return (
    <div className="px-4 sm:px-[85px]">
      <section className="mt-[64px] sm:mt-[104px] py-[24px] sm:py-[31px] text-center">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">WALL OF FAITH</h1>
        <p className="mt-4 text-base sm:text-lg text-gray-500">Every step of the journey.</p>
      </section>
      <SpineTimeline groups={groups} />
    </div>
  );
}
```

- [ ] **Step 2: Components**

```tsx
// src/components/wall-of-faith/spine/SpineTimeline.tsx
"use client";
import { useState } from "react";
import type { WofYearGroup } from "@/lib/wall-of-faith/model";
import SpineYear from "./SpineYear";

export default function SpineTimeline({ groups }: { groups: WofYearGroup[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));
  return (
    <div className="relative mx-auto max-w-5xl pb-[64px] sm:pb-[97px]">
      {/* the spine: left edge on phones, centered from sm */}
      <div aria-hidden className="absolute top-0 bottom-0 left-[31px] sm:left-1/2 w-px bg-[#d9c9b0]" />
      {groups.map((g) => <SpineYear key={g.year} group={g} openId={openId} onToggle={toggle} />)}
    </div>
  );
}
```

```tsx
// src/components/wall-of-faith/spine/SpineYear.tsx
import type { WofYearGroup } from "@/lib/wall-of-faith/model";
import SpineNode from "./SpineNode";

type Props = { group: WofYearGroup; openId: string | null; onToggle: (id: string) => void };

export default function SpineYear({ group, openId, onToggle }: Props) {
  return (
    <section className="relative">
      <div className="relative flex sm:justify-center py-10">
        <div className="relative z-10 ml-0 sm:ml-0 rounded-full border-2 border-[#d9c9b0] bg-white px-6 sm:px-10 py-3 text-center">
          <p className="text-2xl sm:text-3xl font-black italic tracking-[6px] text-[#8b7355]">{group.year}</p>
          {group.theme && <p className="text-[10px] sm:text-[11px] uppercase tracking-[2.5px] text-[#a0896a] max-w-[16rem]">{group.theme}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-8 sm:gap-10">
        {group.events.map((e, i) => (
          <SpineNode key={e.id} event={e} side={i % 2 === 0 ? "left" : "right"} open={openId === e.id} onToggle={() => onToggle(e.id)} />
        ))}
      </div>
    </section>
  );
}
```

```tsx
// src/components/wall-of-faith/spine/SpineNode.tsx
import type { WofEvent } from "@/lib/wall-of-faith/model";
import EventPhoto from "../EventPhoto";
import MilestoneBadge from "../MilestoneBadge";
import SpineDetail from "./SpineDetail";

type Props = { event: WofEvent; side: "left" | "right"; open: boolean; onToggle: () => void };

export default function SpineNode({ event, side, open, onToggle }: Props) {
  const heading = (
    <div className={`min-w-0 break-words ${side === "left" ? "sm:text-right" : "sm:text-left"}`}>
      <p className="text-[11px] uppercase tracking-[1.5px] text-[#a0896a]">{event.dateLabel}</p>
      {event.milestone && <div className="my-1"><MilestoneBadge text={event.milestone} /></div>}
      <h3 className="text-lg sm:text-xl font-bold text-[#3d2f1e] leading-tight">{event.title}</h3>
    </div>
  );
  const body = <p className="min-w-0 break-words text-sm text-[#6b5540] leading-relaxed">{event.description}</p>;

  return (
    <div>
      {/* phones: node at left, everything to its right. sm+: heading | node | body, alternating. */}
      <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[1fr_104px_1fr] items-center gap-x-4 sm:gap-x-8">
        <div className={`hidden sm:block ${side === "left" ? "" : "sm:order-3"}`}>{heading}</div>
        <button
          onClick={onToggle} aria-expanded={open} aria-label={`${event.title} — ${open ? "close" : "open"} details`}
          className="relative z-10 sm:order-2 h-16 w-16 sm:h-[104px] sm:w-[104px] rounded-full border-2 border-[#d9c9b0] bg-white p-1 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8b7355]"
        >
          <span className="relative block h-full w-full overflow-hidden rounded-full">
            <EventPhoto event={event} rounded="full" sizes="104px" />
          </span>
        </button>
        <div className={`hidden sm:block ${side === "left" ? "sm:order-3" : ""}`}>{body}</div>
        <div className="sm:hidden min-w-0 space-y-1">{heading}{body}</div>
      </div>
      {open && <SpineDetail event={event} />}
    </div>
  );
}
```

```tsx
// src/components/wall-of-faith/spine/SpineDetail.tsx
import type { WofEvent } from "@/lib/wall-of-faith/model";
import EventPhoto from "../EventPhoto";
import MilestoneBadge from "../MilestoneBadge";

export default function SpineDetail({ event }: { event: WofEvent }) {
  return (
    <div className="relative z-10 mt-4 ml-[80px] sm:mx-auto sm:max-w-[520px] rounded-2xl border border-[#e8dccb] bg-[#fffaf4] p-4 sm:p-6 break-words">
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl">
        <EventPhoto event={event} sizes="(max-width: 640px) 90vw, 520px" />
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-[1.5px] text-[#a0896a]">{event.dateLabel}</p>
      {event.milestone && <div className="mt-2"><MilestoneBadge text={event.milestone} /></div>}
      <h3 className="mt-1 text-xl font-bold text-[#3d2f1e]">{event.title}</h3>
      <p className="mt-2 text-sm text-[#6b5540] leading-relaxed">{event.description}</p>
      {event.significance && <p className="mt-3 text-sm italic text-[#8b7355] leading-relaxed">{event.significance}</p>}
      {event.youtubeUrl && (
        <a href={event.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm font-bold text-[#cc0000] hover:underline">▶ Watch on YouTube</a>
      )}
    </div>
  );
}
```
On phones the detail card's `ml-[80px]` aligns it with the text column right of the 64 px node; check that it fits at 390 px (Step 3), and switch to `ml-0` if it doesn't.

- [ ] **Step 3: Verify against the June 2 references (Review Focus 1, 2, 5)**

Playwright at 1280: screenshot the first 900 px and compare by eye with `page-2026-06-02T04-07-38-196Z.jpeg` — pill, spine, alternating heading/description, circle size. Click "Opening Prayer" → detail card appears below with photo, date, title, description, significance; click another node → first closes; click again → closes. Keyboard: Tab to a node, Enter toggles. At 390: spine at left, no horizontal scroll (`scrollWidth === 390`) with a node open; long-text temp row check as in Task 7 Step 5. Year with zero public events is absent.

- [ ] **Step 4: Typecheck and commit**

```bash
git add src/app/wall-of-faith-2 src/components/wall-of-faith/spine
git commit -m "feat(wof): circle-spine design at /wall-of-faith-2 (rebuilt from 06-02 snapshots)"
```

---

### Task 9: Photos — download, pick, process, upload

**Files:**
- Create: `scripts/wof/photos/lib.mjs`, `scripts/wof/photos/lib.test.mjs`, `scripts/wof/photos/make-picker.mjs`, `scripts/wof/photos/process-and-upload.mjs`

**Interfaces:**
- Produces: `blobKey(slug: string, bytes: Buffer): string` → `wall-of-faith/<slug>-<8 hex of sha256>.jpg`; `parsePicks(json: string): Record<string, string>` (slug → absolute photo path; throws on non-object, non-string values, or slugs failing `^[a-z0-9-]+$`); `folderSlugMap` file `.wof-photos/folders.json` `{ "<drive folder id>": "<slug>" }`.

- [ ] **Step 1: Failing tests for the helpers**

```js
// scripts/wof/photos/lib.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { blobKey, parsePicks } from "./lib.mjs";

test("blobKey is stable per content and namespaced", () => {
  const a = blobKey("2024-mission-fair", Buffer.from("abc"));
  assert.match(a, /^wall-of-faith\/2024-mission-fair-[0-9a-f]{8}\.jpg$/);
  assert.equal(a, blobKey("2024-mission-fair", Buffer.from("abc")));
  assert.notEqual(a, blobKey("2024-mission-fair", Buffer.from("abd")));
});

test("parsePicks validates shape", () => {
  assert.deepEqual(parsePicks('{"2024-mission-fair":"/x/a.jpg"}'), { "2024-mission-fair": "/x/a.jpg" });
  assert.throws(() => parsePicks("[]"));
  assert.throws(() => parsePicks('{"Bad Slug":"/x"}'));
  assert.throws(() => parsePicks('{"ok":3}'));
});
```
Run `npm test` → FAIL (module missing).

- [ ] **Step 2: Implement `lib.mjs`**

```js
// scripts/wof/photos/lib.mjs
import { createHash } from "node:crypto";

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
```
Run `npm test` → PASS.

- [ ] **Step 3: Download candidates from Drive (Claude, via the Workspace MCP)**

As `dev.newseoulchurch@gmail.com`: list each year folder (`2023` `1t33GIfHJHEFTgdNvhCeuXPBwERWoXvN8`, `2024` `1RSAI2OR0REYr-vpdrT4ktEBkrWkRKjO7`, `2025` `1giigNsknXfunWAIwNjRC0j-4fRBL7F58`), map each event folder to a slug from the DB (by date + title; write `.wof-photos/folders.json`), list its images, and download up to 15 evenly spaced across the folder (all if ≤ 15) with `get_drive_file_download_url` into `.wof-photos/<slug>/`. Skip videos. Record folders with no images.

- [ ] **Step 4: `make-picker.mjs`**

```js
// scripts/wof/photos/make-picker.mjs — run: node scripts/wof/photos/make-picker.mjs
// Builds .wof-photos/picker.html: one row per slug, thumbnails, Claude's suggestion pre-selected.
// Suggestions come from .wof-photos/suggest.json { slug: filename } written by Claude after looking at the photos.
import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = resolve(".wof-photos");
const suggest = existsSync(join(ROOT, "suggest.json")) ? JSON.parse(readFileSync(join(ROOT, "suggest.json"), "utf8")) : {};
const slugs = readdirSync(ROOT).filter((d) => statSync(join(ROOT, d)).isDirectory() && /^[a-z0-9-]+$/.test(d)).sort();

const rows = slugs.map((slug) => {
  const dir = join(ROOT, slug);
  const thumbs = join(dir, "_thumbs");
  mkdirSync(thumbs, { recursive: true });
  const files = readdirSync(dir).filter((f) => /\.(jpe?g|png|heic|webp)$/i.test(f)).sort();
  const cells = files.map((f) => {
    const t = join(thumbs, f.replace(/\.\w+$/, ".jpg"));
    if (!existsSync(t)) execFileSync("sips", ["-s", "format", "jpeg", "-Z", "320", join(dir, f), "--out", t], { stdio: "ignore" });
    const checked = suggest[slug] === f ? "checked" : "";
    return `<label><input type="radio" name="${slug}" value="${join(dir, f)}" ${checked}><img loading="lazy" src="${t}"></label>`;
  }).join("");
  return `<section><h2>${slug} <small>${files.length} photos</small></h2><div class="row">${cells || "<em>no photos</em>"}</div></section>`;
}).join("\n");

writeFileSync(join(ROOT, "picker.html"), `<!doctype html><meta charset="utf-8"><title>WoF picker</title>
<style>body{font:14px system-ui;margin:16px}h2{font-size:15px;margin:24px 0 8px}.row{display:flex;flex-wrap:wrap;gap:6px}
label{position:relative}input{position:absolute;opacity:0}img{width:160px;height:160px;object-fit:cover;border:4px solid transparent;border-radius:6px}
input:checked+img{border-color:#e07b00}button{position:sticky;top:8px;padding:8px 14px;font-weight:600}</style>
<button onclick="save()">Save picks.json</button>
${rows}
<script>function save(){const p={};document.querySelectorAll('input:checked').forEach(i=>p[i.name]=i.value);
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:'application/json'}));
a.download='picks.json';a.click()}</script>`);
console.log(`picker: ${join(ROOT, "picker.html")} (${slugs.length} events)`);
```

- [ ] **Step 5: Claude suggests, Chan picks**

Claude views each event's thumbnails (Read tool on `_thumbs/*.jpg`, a few per event) and writes `.wof-photos/suggest.json` choosing, per event, a photo that shows people engaged in the event, faces visible, well lit, crops well to a square and a circle. Run `node scripts/wof/photos/make-picker.mjs`; Chan opens `.wof-photos/picker.html` locally (`open .wof-photos/picker.html`), adjusts, clicks Save, and moves `picks.json` into `.wof-photos/`.

- [ ] **Step 6: `process-and-upload.mjs`**

```js
// scripts/wof/photos/process-and-upload.mjs — run: node --env-file=.env.local scripts/wof/photos/process-and-upload.mjs [--dry-run]
// For each pick: 1600px long edge, JPEG q82, metadata stripped (ffmpeg), put() to Blob, set image_url.
import { readFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { put, del } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";
import { blobKey, parsePicks } from "./lib.mjs";

const dry = process.argv.includes("--dry-run");
const ROOT = resolve(".wof-photos");
const OUT = join(ROOT, "_out"); mkdirSync(OUT, { recursive: true });
const picks = parsePicks(readFileSync(join(ROOT, "picks.json"), "utf8"));
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

for (const [slug, src] of Object.entries(picks)) {
  const { data: row, error } = await db.from("wall_of_faith_events").select("id, image_url").eq("slug", slug).maybeSingle();
  if (error || !row) { console.error(`SKIP ${slug}: no row`); continue; }
  const out = join(OUT, `${slug}.jpg`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src,
    "-vf", "scale='if(gt(iw,ih),min(1600,iw),-2)':'if(gt(iw,ih),-2,min(1600,ih))'",
    "-map_metadata", "-1", "-q:v", "4", out]);                 // q:v 4 ≈ JPEG quality 82
  const bytes = readFileSync(out);
  const key = blobKey(slug, bytes);
  if (row.image_url?.endsWith(`/${key}`)) { console.log(`same  ${slug}`); continue; }
  if (dry) { console.log(`would upload ${slug} → ${key} (${Math.round(bytes.length / 1024)} KB)`); continue; }
  const blob = await put(key, bytes, { access: "public", contentType: "image/jpeg", addRandomSuffix: false, allowOverwrite: true });
  const { error: upErr } = await db.from("wall_of_faith_events").update({ image_url: blob.url, updated_at: new Date().toISOString() }).eq("id", row.id);
  if (upErr) { await del(blob.url).catch(() => {}); console.error(`FAIL ${slug}: ${upErr.message}`); continue; }
  if (row.image_url && row.image_url !== blob.url && row.image_url.includes(".blob.vercel-storage.com/")) await del(row.image_url).catch(() => {});
  console.log(`ok    ${slug} → ${blob.url}`);
}
```
Run `--dry-run` first; check one output with `exiftool _out/<slug>.jpg` (or `ffprobe`) shows no GPS/EXIF; then run for real.

- [ ] **Step 7: NAS gaps**

For events still without a pick (DT Phase 1 Cohort 1, DT Phase 2 Cohort 1, Christmas Project 2025, Christmas 2025, 2026 drafts, any empty Drive folder): search Immich on this Mac (per `~/github/nsc-photo-archive` docs) by date range and keywords, copy up to 10 candidates per event into `.wof-photos/<slug>/` locally, re-run `make-picker.mjs`. Only photos Chan picks in `picks.json` are processed; tell Chan explicitly which picks come from the NAS before running Step 6.

- [ ] **Step 8: Verify and commit**

Both public pages: every picked event shows its photo (no broken images: `[...document.images].every(i => i.complete && i.naturalWidth > 0)`), placeholders only where no pick exists. `.wof-photos/` not in `git status`.
```bash
git add scripts/wof/photos
git commit -m "feat(wof): photo picker and process/upload scripts"
```

---

### Task 10: Staff comparison screenshots

**Files:** none in the repo (outputs to `~/.playwright-mcp/` or the scratchpad; never published).

- [ ] **Step 1: Capture matching views**

Both designs at 1280×900 and 390×844, scrolled to the same stretch (2024 Mar 25 – May 15: Passion Week → Sports Monster, which has milestones, significance and photos), plus each design's top-of-page. For the spine, one shot with Good Friday's card open.

- [ ] **Step 2: Assemble**

Ask Chan for the format (PDF page, slides, or image pair for Kakao) and build it side by side, labelled "A · Scrapbook" and "B · Circle spine". No publishing to claude.ai or Drive unless Chan asks.

---

### Task 11: Ship the chosen design (after staff decide)

Gate: Chan names the winner.

- [ ] **Step 1: Remove the loser**

Scrapbook wins: `git rm -r src/app/wall-of-faith-2 src/components/wall-of-faith/spine`.
Spine wins: move `src/app/wall-of-faith-2/page.tsx` → `src/app/wall-of-faith/page.tsx` (drop `robots: { index: false }`), `git rm src/components/wall-of-faith/YearSection.tsx src/components/wall-of-faith/PolaroidCard.tsx`, remove the `wall-of-faith-2` route dir.
Run `grep -rn "wall-of-faith-2\|YearSection\|PolaroidCard\|spine/" src` to confirm no dangling imports; typecheck clean; `npm test` passes.

- [ ] **Step 2: Final checks**

Header nav link `/wall-of-faith` present; admin link present. Playwright pass on `/wall-of-faith` (desktop + phone) and `/admin/wall-of-faith`. No `needs_review` rows visible publicly.

- [ ] **Step 3: PR and merge**

```bash
git push origin feature/wall-of-faith
gh pr create -R newseoulchurch/nsc-web --base main --head feature/wall-of-faith --title "Wall of Faith: Supabase data, photos, milestones, admin" --body-file <summary>
```
Merge with a merge commit after Chan's OK; wait for the Vercel production deployment of the merge SHA; verify https://www.newseoulchurch.org/wall-of-faith (photos load, milestones show, drafts absent). Sync develop: merge `main` into `develop`, push.

- [ ] **Step 4: Handoff**

Update the vault HANDOFF (session N): Wall of Faith shipped, which design, admin URL, how to clear `needs_review`, what's still waiting on Margot.
