# Announcement Bulletin — Design Spec

**Date:** 2026-06-15
**Branch:** `feature/announcement-bulletin`

---

## Overview

A virtual cork board at `/bulletin` where admins upload event posters and announcement slides, position and resize them freely, and visitors can view them fullscreen. Replaces verbal announcements with a persistent, up-to-date visual reference.

---

## Public View (`/bulletin`)

### Layout

- Full-width cork board with warm tan texture (repeating diagonal line pattern, ~22% opacity over `#c4a06a` base)
- Posters rendered at their saved positions using `position: absolute` on a fixed `1200×800px` canvas
- Canvas scales to fit viewport via `transform: scale(...)` — same board on all screen sizes
- Page header above the board: `ANNOUNCEMENTS` title + subtitle "Click any poster to view full size"

### Poster Cards

- Full-bleed image — no caption strip, no pins. The uploaded poster image fills the entire card.
- Each card has: `position: absolute`, `transform: rotate({rotation}deg)`, `box-shadow: 4px 6px 16px rgba(0,0,0,0.45)`, `border-radius: 2px`
- Position, size, and rotation are stored per-item in Supabase

### Lightbox

- Click any poster → dark overlay (`rgba(0,0,0,0.85)`) fades in over the board
- Poster image centered, enlarged to fit viewport with max constraints
- `×` button top-right to close; click outside image to close
- No caption — the poster image contains all information

### Mobile (< 768px)

- Reflows to a 2-column grid on the same cork board background
- Items rendered in grid order (by `created_at` asc), not free-form positions
- Slight rotations preserved per card for visual feel
- Tap to open lightbox (same as desktop)

---

## Admin View (`/admin/bulletin`)

Protected by the existing mock admin cookie (`mock-admin-token`), consistent with other admin pages.

### Layout

- Same cork board canvas as public view, but in edit mode
- Slim toolbar fixed at top: **Upload Image** button (left) + **Save Layout** button (right)

### Interactions

- **Click** a poster → selects it: blue outline (`box-shadow: 0 0 0 2px #3182ce`), corner resize handle (bottom-right), `×` delete button (top-right)
- **Drag** selected poster → repositions it on the canvas (updates `x`, `y`)
- **Drag corner handle** → resizes the poster (updates `width`, `height`)
- **Click `×`** → removes poster from board and deletes image from Vercel Blob
- **Click canvas background** → deselects current item
- **Save Layout** → writes all current positions/sizes/rotations to Supabase

### Upload Flow

1. Admin clicks **Upload Image**
2. File picker opens (accept: `image/*`, max ~10MB enforced client-side)
3. Image POSTs to `/api/bulletin/upload` → stored in Vercel Blob at `bulletin/{timestamp}-{filename}`
4. New item created with default position (center of canvas), default size (`220×280px`), rotation `0deg`
5. Item appears on canvas immediately; admin repositions as needed
6. Admin clicks **Save Layout** to persist

### Constraints

- Max 15 items on the board (enforced: Upload button disabled + toast when at limit)
- No drag-to-rotate in v1 — rotation is set as a fixed random value on upload (`-4` to `+4` degrees), persisting as stored

---

## Data Model

### Supabase — `bulletin_items` table

```sql
CREATE TABLE bulletin_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url   text NOT NULL,
  x           integer NOT NULL DEFAULT 100,
  y           integer NOT NULL DEFAULT 100,
  width       integer NOT NULL DEFAULT 220,
  height      integer NOT NULL DEFAULT 280,
  rotation    real NOT NULL DEFAULT 0,
  z_index     integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

### Vercel Blob

- Images stored at path: `bulletin/{timestamp}-{filename}`
- Existing `BLOB_READ_WRITE_TOKEN` env var is reused — no new infrastructure

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/bulletin/upload` | POST | Accepts image, uploads to Vercel Blob, inserts row in `bulletin_items`, returns new item |
| `/api/bulletin/layout` | GET | Returns all `bulletin_items` ordered by `z_index` |
| `/api/bulletin/layout` | POST | Replaces full layout — deletes existing rows, inserts current state from request body |
| `/api/bulletin/delete/[id]` | DELETE | Deletes item from `bulletin_items` and removes blob from Vercel |

All write routes check for the admin cookie before proceeding.

---

## Components

| Component | Path | Description |
|---|---|---|
| `BulletinBoard` | `src/components/bulletin/BulletinBoard.tsx` | Shared canvas — renders items at saved positions. Read-only mode for public, edit mode for admin |
| `BulletinItem` | `src/components/bulletin/BulletinItem.tsx` | Single poster card — handles selection, drag, resize in edit mode; click-to-lightbox in view mode |
| `BulletinLightbox` | `src/components/bulletin/BulletinLightbox.tsx` | Fullscreen overlay for viewing a poster |
| `BulletinToolbar` | `src/components/bulletin/BulletinToolbar.tsx` | Admin-only top bar with Upload + Save buttons |
| `/bulletin` page | `src/app/bulletin/page.tsx` | Public page — server fetches layout, renders `BulletinBoard` in view mode |
| `/admin/bulletin` page | `src/app/admin/bulletin/page.tsx` | Admin page — renders `BulletinBoard` in edit mode with `BulletinToolbar` |

---

## Storage Decision

- **Poster images → Vercel Blob** (`BLOB_READ_WRITE_TOKEN` already configured)
- **Layout metadata → Supabase `bulletin_items`** (direct Postgres access confirmed)
- No new infrastructure required

---

## Navigation

Add "BULLETIN" nav link in `src/components/layout/Header.tsx` after "WALL OF FAITH", before "EVENTS" — consistent with the pattern used when adding Wall of Faith.

---

## Constraints & Notes

- Vercel Hobby plan 10s function timeout — upload route must complete within limit (~10MB images are fine)
- Admin auth is mock cookie — do not put sensitive data behind this panel
- No drag-to-rotate in v1 — rotation is randomised on upload
- Delete removes from both Supabase and Vercel Blob (keep in sync)
- `wall_of_faith_events` table to be created in same Supabase project (separate task)
