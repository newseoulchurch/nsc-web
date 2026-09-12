# Bulletin: Text Notes and Board Height — Design

**Date:** 2026-09-12
**Branch:** `feature/bulletin-text-and-board-size`
**Status:** Approved design, pending implementation plan

## Goal

Two additions to the announcement bulletin board (`/bulletin`, `/admin/bulletin`):

1. **Text notes.** The admin can add sticky-note style text items to the board, type into them in place, and move, resize, and rotate them with the same handles images use. Each note has a font, font size, text color, and note color. Notes are mainly used as headers for groups of images.
2. **Board height.** The admin can make the board taller or shorter from the toolbar. Width stays fixed at 1200 canvas units.

Out of scope: rich text (per-word formatting), a draw tool, free color pickers, autosave, editing on mobile.

## Current state

- `src/types/bulletin.ts` — `BulletinItem` has `image_url` and layout fields only.
- `src/components/bulletin/BulletinBoard.tsx` — owns items state, the drag/resize/rotate engine, upload, delete, save, and both the desktop canvas and the mobile grid. Canvas size is the constants `CANVAS_W = 1200`, `CANVAS_H = 800`.
- `src/components/bulletin/BulletinItem.tsx` — absolute-positioned wrapper with selection ring, pin, delete button, four handles, and an `<img>` body.
- `src/components/bulletin/BulletinToolbar.tsx` — Upload Image and Save Layout, 15-image cap.
- `src/app/api/bulletin/layout/route.ts` — GET all items; POST wipes and reinserts all items.
- `src/app/api/bulletin/upload/route.ts` — puts the file in Vercel Blob and inserts a row.
- `src/app/api/bulletin/delete/[id]/route.ts` — deletes the row and its blob.
- `src/app/bulletin/page.tsx`, `src/app/admin/bulletin/page.tsx` — query Supabase directly (never fetch own API). Public page is `force-dynamic`.
- The `bulletin_items` table was created by hand in the Supabase dashboard; there are no migration files in the repo.

## Data model

### Schema change

Run in the Supabase SQL editor before deploying:

```sql
alter table bulletin_items
  add column type text not null default 'image' check (type in ('image', 'text')),
  add column content text,
  add column font text,
  add column font_size integer,
  add column text_color text,
  add column note_color text;
alter table bulletin_items alter column image_url drop not null;

create table bulletin_settings (
  id integer primary key default 1 check (id = 1),
  board_height integer not null default 800
);
insert into bulletin_settings (id) values (1);
```

Existing rows get `type = 'image'` from the default. Nothing on the live board changes until the new code ships.

### TypeScript types (`src/types/bulletin.ts`)

```ts
export type BulletinItemBase = {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  z_index: number
  created_at: string
}

export type BulletinImageItem = BulletinItemBase & {
  type: "image"
  image_url: string
}

export type BulletinTextItem = BulletinItemBase & {
  type: "text"
  content: string
  font: NoteFont
  font_size: number
  text_color: string
  note_color: string
}

export type BulletinItem = BulletinImageItem | BulletinTextItem

export type NoteFont = "circular" | "serif" | "hand" | "mono"

export type BulletinSettings = { board_height: number }
```

Rows coming back from Supabase carry every column with nulls for the unused ones. A `parseBulletinItem(row)` helper in `src/types/bulletin.ts` narrows a raw row into the union (dropping rows that fail the type check) so both pages and the layout route share one place that knows the column layout.

### Constants (`src/components/bulletin/noteOptions.ts`)

```ts
export const NOTE_FONTS: Record<NoteFont, { label: string; css: string }>
  // circular → "CircularXX, sans-serif"   (site default)
  // serif    → "Georgia, 'Times New Roman', serif"
  // hand     → the Google font loaded via next/font (Caveat), with cursive fallback
  // mono     → "ui-monospace, Menlo, monospace"
export const NOTE_SIZES = [14, 18, 24, 32, 40, 48, 56, 72]
export const TEXT_COLORS = ["#111111", "#ffffff", "#8b1a1a", "#1a3a8b", "#1f5e2e", "#6b6b6b"]
export const NOTE_COLORS = ["#fff59d", "#f8bbd0", "#bbdefb", "#c8e6c9", "#ffcc80", "#ffffff"]
export const NOTE_DEFAULTS = { font: "circular", font_size: 24, text_color: "#111111", note_color: "#fff59d", width: 260, height: 120 }
export const NOTE_LIMIT = 10
export const BOARD_HEIGHT = { min: 400, max: 3000, step: 100, default: 800, itemMargin: 40 }
```

The handwriting font is loaded once with `next/font/google` (`Caveat`) in the bulletin components and exposed as a CSS variable so it is only downloaded on bulletin pages.

### Board height

Stored in the single `bulletin_settings` row. Both pages read it together with the items and pass `boardHeight` to `BulletinBoard`. If the row is missing, fall back to 800.

## Components

### `BulletinItemFrame` (new, replaces the wrapper half of `BulletinItem.tsx`)

Props: `item`, `mode`, `selected`, `lockAspect`, `onSelect`, `onDelete`, the five `on*Start` pointer handlers, `onViewClick`, `children`.

Owns: absolute positioning from `x/y/width/height/rotation`, the selection ring, the pin in view mode, the delete button, and the rotate, width, height, and corner handles. `lockAspect` only affects which drag type the corner handle starts (`resize` for images, a new free `resize-free` type for notes). Renders `children` inside the clipped body box. This is the existing `BulletinItem.tsx` with the `<img>` removed and the corner-handle behavior parameterized.

### `BulletinImage` (new)

The `<img>` body. `BulletinBoard` wires it into a `BulletinItemFrame` with `lockAspect` and the lightbox `onViewClick`.

### `BulletinNote` (new)

Props: `item: BulletinTextItem`, `mode`, `editing`, `onChange(content)`, `onStartEdit()`, `onEndEdit()`.

Display state: a `div` filled with `note_color`, padding 12, content rendered with the chosen font, size, and color, `white-space: pre-wrap`, `overflow: hidden`. Text wraps at the box width and clips at the box height; the admin resizes the box to fit.

Edit state (edit mode only): the same box but a `textarea` styled identically (same font, size, color, padding, transparent background, no outline, no resize grip) so nothing visually shifts. Enter inserts a newline. `onPointerDown` on the textarea calls `stopPropagation` so typing and text selection never start a drag. Escape or blur calls `onEndEdit`. The textarea is focused on mount with the cursor at the end.

Double-click on the note in edit mode calls `onStartEdit`. Notes are not clickable in view mode.

### `BulletinBoard` changes

- New state: `boardHeight`, `editingId: string | null`.
- `CANVAS_H` becomes `boardHeight`; the scaled container and the canvas div both use it.
- `handleAddNote()`: refuses at `NOTE_LIMIT`; builds a `BulletinTextItem` with `crypto.randomUUID()`, `created_at = new Date().toISOString()`, `NOTE_DEFAULTS`, centered on the visible canvas (`x = (1200 - width) / 2`, `y = (boardHeight - height) / 2`), `z_index` one above the current max; appends it, selects it, sets `editingId`. No server call — notes are persisted only by Save Layout.
- `handleDelete(id)`: for text items, remove locally only (Save Layout's wipe-and-reinsert drops it from the table). Image path unchanged.
- `handleNoteChange(id, patch)`: shallow-merges a partial `BulletinTextItem` (used by both the textarea and the format toolbar).
- `handleBoardHeight(next)`: clamps to `[min, max]`, then to at least `maxBottom + itemMargin` where `maxBottom = max(item.y + item.height)`. If the requested value was raised by the item clamp, show a brief inline message next to the control: "Move or shrink the lowest item to go shorter."
- Drag engine: add `resize-free` (width and height follow dx and dy independently, min 80 each). No other change.
- Canvas click clears `selectedId` and `editingId`. Selecting a different item also clears `editingId`.
- `handleSave()` posts `{ items, board_height: boardHeight }`.
- Rendering: map items to `BulletinItemFrame` with either `BulletinImage` or `BulletinNote` as the body, keyed by `item.type`.

### `BulletinToolbar` changes

Row one (existing bar):

- Counter becomes `images 3/15 · notes 1/10`.
- **+ Add Note** button next to Upload Image, disabled at the note limit.
- **Board height** control: `[−] [ 800 ] [+]`. Number input accepts typed values, committed on blur or Enter; buttons step by 100. Disabled states at the clamps. The item-clamp message renders beside it.
- Save Layout unchanged.

Row two, `BulletinFormatBar` (new, rendered only when the selected item is a note):

- Font select (4 options, labels: Circular, Serif, Handwritten, Mono).
- Size select (`NOTE_SIZES`).
- Text color: six swatches; the active one has a ring.
- Note color: six swatches; the active one has a ring.
- Every change calls `onChange` immediately; the note re-renders live.

Both rows share the dark toolbar styling already in use.

## Public view and mobile

### Desktop (`mode="view"`)

Notes render at their saved position, rotation, and colors, pin included, and do nothing on click. Images keep the lightbox. Notes with empty content are skipped on the public page (they still show on the admin page so they can be found and deleted).

### Mobile

The mobile grid is replaced by a reading-order list:

1. Sort into rows: sort by `y`; walk the list and start a new row whenever an item's `y` is more than 40 canvas units below the first item of the current row. Sort each row by `x`. Flatten.
2. Walk the flattened list, emitting blocks: each text note is a full-width block; consecutive images are collected into one two-column grid.
3. Note block: `note_color` background, chosen font and `text_color`, font size × 0.7 (min 14), padding 12, `white-space: pre-wrap`, `transform: rotate(rotation deg)` clamped to ±4° so a strongly rotated header does not overflow the column, the same paper shadow as image cards.
4. Image cells are unchanged from today (3/4 aspect, lightbox tap in view mode).

The ordering helper `orderForMobile(items)` lives in `src/components/bulletin/mobileOrder.ts` so it can be unit-tested in isolation if a test runner is ever added.

Admin mobile view keeps this same read-only rendering; editing is desktop-only.

## API

### `POST /api/bulletin/layout`

Body: `{ items: BulletinItem[], board_height: number }`.

Validation before any write (400 on failure):

- `items` is an array of at most 15 image items and 10 text items.
- Every item has a UUID `id`, numeric `x/y/width/height/rotation/z_index`, and `type` of `"image"` or `"text"`.
- Image items have a non-empty `image_url`.
- Text items have string `content`, a `font` in `NOTE_FONTS`, `font_size` in `NOTE_SIZES`, and `text_color` / `note_color` matching `#rrggbb`.
- `board_height` is an integer in `[400, 3000]`.

Then, as today: delete all rows, insert all items (mapping every column, nulls for the unused type's fields), then `update bulletin_settings set board_height = ... where id = 1`. The existing note about the delete-then-insert window stays.

### `GET /api/bulletin/layout`

Returns `{ items, board_height }`. (Still unused by the pages, which query Supabase directly; kept consistent for completeness.)

### `DELETE /api/bulletin/delete/[id]`

Unchanged. It already skips the blob step when `image_url` is null. The client never calls it for notes.

### `POST /api/bulletin/upload`

Inserts rows with `type: "image"` explicitly.

### Pages

Both pages `select("*")` from `bulletin_items`, map through `parseBulletinItem`, and `select("board_height")` from `bulletin_settings` (single row, fallback 800). They pass `initialItems` and `boardHeight` to `BulletinBoard`.

## Error handling

- Save failure: existing alert path; local state is kept so the admin can retry.
- Note limit or image limit reached: the corresponding button is disabled with its label changed, as Upload does today.
- Board height clamp: inline message, value snaps to the nearest allowed height.
- A row that fails `parseBulletinItem` (for example a text row with null content from a manual edit) is dropped from the render rather than crashing the page.

## Verification

No automated test suite exists in this repo. Manual checks on the local dev server, then on the Vercel preview after running the SQL:

1. Existing board renders unchanged before and after the migration.
2. Add Note places a centered yellow note in edit mode; typing, Enter, and Escape behave as specified.
3. Single click selects and shows the format bar; font, size, and both colors update live.
4. Drag, rotate, width, height, and free corner resize all work on a note; images keep aspect-locked corner resize.
5. Delete on an unsaved note and on a saved note both remove it; after Save and reload it stays gone.
6. Board height: stepper and typed values clamp correctly; shrinking below the lowest item is refused with the message; the canvas resizes live; the value survives Save and reload.
7. Public desktop page: notes are static, images open the lightbox, empty notes are hidden.
8. Public page at phone width: a header note placed above a cluster of images appears full-width directly before them; images below are in the two-column grid.
9. Save with a hand-tampered payload (wrong `type`, missing `content`) returns 400 and leaves the board intact.

## Files

```
src/types/bulletin.ts                              modified: union type, parseBulletinItem
src/components/bulletin/noteOptions.ts             new: fonts, sizes, colors, limits
src/components/bulletin/mobileOrder.ts             new: orderForMobile
src/components/bulletin/BulletinItemFrame.tsx      new: extracted from BulletinItem.tsx
src/components/bulletin/BulletinImage.tsx          new
src/components/bulletin/BulletinNote.tsx           new
src/components/bulletin/BulletinFormatBar.tsx      new
src/components/bulletin/BulletinItem.tsx           removed
src/components/bulletin/BulletinToolbar.tsx        modified: Add Note, counters, board height
src/components/bulletin/BulletinBoard.tsx          modified: state, add/delete/change, height, rendering, mobile list
src/app/api/bulletin/layout/route.ts               modified: validation, settings update
src/app/api/bulletin/upload/route.ts               modified: explicit type
src/app/bulletin/page.tsx                          modified: settings query, parse
src/app/admin/bulletin/page.tsx                    modified: settings query, parse
```
