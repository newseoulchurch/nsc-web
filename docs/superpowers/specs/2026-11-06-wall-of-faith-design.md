# Wall of Faith — Data, Photos, Admin, and Two Designs

**Date:** 2026-11-06 · **Status:** approved in conversation, pending written review · **Branch:** `feature/wall-of-faith`

## Goal

Ship a Wall of Faith page that shows NSC's real journey since 2023, with real photos, the church's spiritual milestones layered on the events, and content that staff can keep current without a code change. Two designs, the existing **scrapbook** (`/wall-of-faith`) and a rebuilt **circle spine** (`/wall-of-faith-2`), are built on the same data so staff can choose one from a side-by-side comparison. Only the chosen design ships.

Vision check (`Vision.md`): "Show the heart of NSC, online as we are in person"; nothing just for show. The milestone layer is the part that carries the heart. Drafted text never reaches the public page unreviewed.

## Scope

In scope:
1. Supabase tables + one SQL migration that creates and seeds them.
2. Photos: Drive folder first, then the NAS for gaps, picked by Chan, uploaded to Vercel Blob.
3. Real admin CRUD at `/admin/wall-of-faith`, replacing the stub.
4. Both public designs, reading the database, with the milestone layer.
5. Staff comparison screenshots; then ship the chosen design.

Out of scope: per-event galleries (one cover photo per event), a focus-point/crop control, the "progressing radar" milestone visualization (Recalibrate's later layer), member login.

## Content sources

| Source | What it gives |
|---|---|
| `src/data/wall-of-faith.ts` (this branch) | 43 events 2023–2025: title, date label, description |
| Margot's Recalibrate agenda doc, part 5 (`1DuegjPVeApfrb-oipMHtSAqvqdkajL9y_dFLFmlaO9U`, last edited 2026-10-23) | Milestone tags (~20 events), significance sentences (~18, mostly 2023 → Jul 2024), New Glow (Oct 26, 2024), Christmas renames, year themes |
| Drive photo folder `1NXNezjCZq0xOTQwKxsCm_0KzkSQGdioi` (`2023/`, `2024/`, `2025/`, 44 event folders) | Cover photos; also reveals events missing from the data |
| NAS (Immich, `~/github/nsc-photo-archive`) | Photos for events with no Drive folder; per-case approval required (that repo's hard rule) |
| chanOS NSC notes (be-ready, dt, lifegroup) | Raw material for 2026 drafts |

Margot may not be finished; Chan asked her on 2026-11-06. Anything she later adds is entered through the admin, so the build does not wait on her.

### Content decisions

- **Year themes:** 2023 "Made New to Make New" (Chan's call; Margot's doc says "Radical obedience"), 2024 "Walking Toward the Call, Calling All Who Walk", 2025 "Made for More", 2026 "Be · Ready · Be Ready".
- **Corrections applied in the seed:** NSK VBS date → Aug 9–10, 2025 (Drive folder; the data had copied Korea Mission's dates). Dec 25, 2024 "Christmas Play" → title "Christmas", milestone "Christmas play". Dec 25, 2025 "Christmas Film" → title "Christmas", milestone "Christmas film". Christmas Project milestone "Guardians system for Sunduk Orphanage kids".
- **New events, drafted by Claude, seeded with `needs_review = true`:** New Glow (Oct 26, 2024; Margot's tag "Young people's gathering"), SolMen DT Phase 1 Cohort 2 (2024), Discipleship Sunday (Mar 10, 2024), DT Phase 1 Cohort 3 (2025), Baptism (Apr 6, 2025), and every 2026 event.
- **Milestone tags** are shown as Margot wrote them, first letter capitalized. Cryptic ones ("clicker", "light", "basketball") are listed for Chan to confirm during review; they are not flagged.
- **Significance** is only Margot's text. Blank stays blank (no line shown). Claude does not draft significance.

## 1. Data model

```sql
create table wall_of_faith_years (
  year  int primary key,
  theme text not null
);

create table wall_of_faith_events (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,          -- "2024-good-friday-service"; photo filenames use it
  year          int  not null references wall_of_faith_years(year),
  sort_date     date not null,                 -- start date for ranges; orders events within a year
  date_label    text not null,                 -- displayed as-is: "Mar 25–28, 2024", "2025 (ongoing)"
  title         text not null,
  description   text not null default '',
  milestone     text,
  significance  text,
  image_url     text,
  youtube_url   text,
  needs_review  boolean not null default false, -- true = hidden from public pages
  updated_at    timestamptz not null default now()
);
```

- `year` is the section an event shows under, independent of `sort_date` (Opening Prayer starts Dec 2022 but belongs to 2023; New Year Service Jan 1, 2024 belongs to 2023 as in the current data).
- Ordering: `year`, then `sort_date`, then `title`. Replaces the hand-maintained `order` field.
- RLS enabled on both tables, no policies. All reads and writes are server-side with the service role, as for `bulletin_items`.
- Migration file: `docs/superpowers/migrations/2026-11-06-wall-of-faith.sql`. Creates both tables and inserts every year and event row. Chan runs it in the Supabase SQL editor. A second run fails on `create table`; that is expected.
- `src/data/wall-of-faith.ts` is deleted once the pages read the database (the migration is generated from it first).

## 2. Photos

1. **Download** each Drive event folder (as `dev.newseoulchurch@gmail.com`) into `.wof-photos/<slug>/`, gitignored.
2. **Propose** one cover per event; Claude reviews the photos and pre-selects.
3. **Pick:** a local HTML contact sheet (`.wof-photos/picker.html`, opened from disk, never published) shows each event's thumbnails with Claude's pick highlighted. Chan clicks to override; the page saves `picks.json`.
4. **Process:** 1600 px long edge, JPEG q82, all metadata stripped (EXIF incl. GPS).
5. **Upload** (`scripts/wof-upload-photos.mjs`): `put()` to Blob as `wall-of-faith/<slug>-<shorthash>.jpg`, then update `image_url` for that slug. Re-runnable; skips slugs whose current picked file hash already matches.
6. **NAS gaps** (events with no Drive folder: DT Phase 1 Cohort 1, DT Phase 2 Cohort 1, Christmas Project 2025, Christmas 2025, all of 2026): Claude searches Immich locally and adds candidates to the same picker. A NAS photo is uploaded only when Chan picks it for that event; that pick is the per-case instruction the photo-archive rule requires.

Needs `.env.local` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BLOB_READ_WRITE_TOKEN`), lost in the 10/19 restore. Chan restores it from the Vercel dashboard (`nscs-projects/nsc-web` → Settings → Environment Variables) or `vercel env pull` after installing the CLI.

Images are cropped to fill (polaroid square, spine circle) at center. No focus-point column until a crop actually cuts badly.

## 3. Admin (`/admin/wall-of-faith`)

Protected by the existing `/admin` layout (cookie presence). Replaces the stubbed page.

- **List** grouped by year; each row shows photo thumb, date label, title, milestone, and a "Needs review" chip. A filter toggles "Needs review only", with the count in the header.
- **Edit** (modal or inline panel): every column above. `needs_review` is a checkbox.
- **Photo:** upload or replace. Client-side compression to ≤ 1600 px / ~500 KB (same approach as the events admin), then the upload route `put()`s to Blob and the old blob is deleted on replace.
- **Add** event; **delete** with a confirm dialog (deletes the blob too).
- **Year themes** edited inline above the list; adding an event in a new year requires the year row first (the form offers to create it).

API routes (each checks the `adminToken` cookie, validates server-side, returns 400 on bad input):

| Route | Method | Does |
|---|---|---|
| `/api/wall-of-faith/events` | POST | create |
| `/api/wall-of-faith/events/[id]` | PATCH / DELETE | update / delete (+ blob) |
| `/api/wall-of-faith/upload` | POST | image → Blob, returns URL; replaces + deletes old when `eventId` given |
| `/api/wall-of-faith/years` | PUT | upsert `{year, theme}` |

Validation: title 1–120 chars, date_label 1–60, description ≤ 1000, milestone ≤ 60, significance ≤ 400, slug `^[a-z0-9-]+$` unique, `sort_date` a valid date, `year` 2022–2100, URLs must be https.

## 4. Public pages

Shared:
- `src/lib/wall-of-faith.ts`: `loadWallOfFaith(db)` → `{ years: { year, theme, events[] }[] }`, public rows only (`needs_review = false`). Server components call it directly (never fetch the app's own API). Both pages `force-dynamic`.
- `MilestoneBadge` (small pill, "✦ Washing feet"), `EventPhoto` (`next/image` on the Blob host already allowed in `next.config.ts`, fill + cover; placeholder with the event title when `image_url` is null).
- Significance renders in italics under the description when present.

**Scrapbook `/wall-of-faith`:** existing `YearSection` + `PolaroidCard`, rewired to the loader; real photo in the polaroid; milestone badge above the title; significance line; a 2026 section. Mobile: single column, polaroid above text.

**Circle spine `/wall-of-faith-2`:** rebuilt from the 2026-06-02 snapshots (vault `NSC Website/.playwright-mcp/page-2026-06-02T04-07-*.jpeg`): centered vertical line; rounded pill per year with the year and theme; a circle node per event showing its photo; date + title on one side and description on the other, alternating; clicking a node expands a detail card below it (large photo, date, title, description, milestone, significance); one open at a time. Mobile: line at the left, node and all text to its right, detail card full width.

Components live in `src/components/wall-of-faith/` (shared + scrapbook) and `src/components/wall-of-faith/spine/` (circle spine), so the losing design deletes as one folder plus its route.

## 5. Comparison, ship, testing

**Comparison:** after photos are in, Playwright screenshots of both designs at 1280 px and 390 px over the same stretch (e.g. 2024 Mar–May, which has milestones and significance), arranged side by side for the staff meeting. Format chosen then.

**Ship (after staff choose):**
1. Run the migration and the photo upload against production (new tables; the live site is unaffected).
2. Rebase `feature/wall-of-faith` on `main`, dropping `5b2dadb` (bulletin spec docs already on main).
3. Delete the losing design (route + components); keep the nav link on the winner.
4. PR to `newseoulchurch/nsc-web`, merge, verify `/wall-of-faith` on https://www.newseoulchurch.org, sync develop.

**Testing:**
- `npx tsc --noEmit` shows no errors in touched files (pre-existing errors elsewhere on main are known).
- Playwright, both designs at desktop and phone: all years render, photos load, badges and significance appear only where set, `needs_review` rows absent, spine expand/collapse works.
- Admin against production with a throwaway row created with `needs_review = true` (invisible publicly): create, edit, upload/replace photo (old blob gone), delete (row and blob gone).
- API: missing cookie → 401; oversize/invalid fields, bad slug, non-https URL → 400.

## Risks and constraints

- Local dev and Vercel previews use the production Supabase DB. Admin tests use review-flagged rows only.
- The losing design must be removed before merge; nothing unchosen ships.
- Photos of people on a public page: Drive photos were shared by staff for this purpose; NAS photos only by Chan's per-event pick.
- Margot's significance text covers roughly half the events; the page looks uneven until she finishes. Acceptable: milestones are meant to mark turning points, not every row.
