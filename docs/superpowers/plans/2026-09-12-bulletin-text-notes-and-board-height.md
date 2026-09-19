# Bulletin Text Notes and Board Height Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sticky-note text items (add, edit in place, move, resize, rotate, font/size/color) and an admin-adjustable board height to the announcement bulletin board.

**Architecture:** `BulletinItem` becomes a discriminated union (`image` | `text`) stored in the existing `bulletin_items` table via a `type` column; board height lives in a single-row `bulletin_settings` table. The item wrapper is split into `BulletinItemFrame` (handles, selection, drag wiring) with `BulletinImage` and `BulletinNote` bodies. The mobile view is rebuilt as a reading-order list so notes act as section headers.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, Tailwind, Supabase JS (service role, server side), Vercel Blob, `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-09-12-bulletin-text-notes-and-board-height-design.md`

**Verification convention:** there is no test runner in this repo. After every task run:

```bash
npx tsc --noEmit && npm run lint
```

Expected: no output from `tsc`, and lint ends with `✔ No ESLint warnings or errors`. Browser checks happen in Task 10 against `npx next dev -p 3001` (port 3000 is used by another project on this machine).

**Branch:** `feature/bulletin-text-and-board-size` (already created from `main`).

---

## File map

| File | Responsibility |
|---|---|
| `src/types/bulletin.ts` | Union type, settings type, `parseBulletinItem` row narrowing |
| `src/components/bulletin/noteOptions.ts` | Fonts, sizes, color swatches, limits, board height bounds, note defaults |
| `src/components/bulletin/handFont.ts` | Loads the Caveat handwriting font via `next/font/google` |
| `src/components/bulletin/mobileOrder.ts` | `orderForMobile` — reading-order sort + block grouping |
| `src/components/bulletin/BulletinItemFrame.tsx` | Absolute wrapper: selection ring, pin, delete, handles, pointer wiring |
| `src/components/bulletin/BulletinImage.tsx` | `<img>` body |
| `src/components/bulletin/BulletinNote.tsx` | Note body, display + inline textarea editing |
| `src/components/bulletin/BulletinFormatBar.tsx` | Font / size / text color / note color controls for the selected note |
| `src/components/bulletin/BulletinToolbar.tsx` | Upload, Add Note, counters, board height stepper, Save |
| `src/components/bulletin/BulletinBoard.tsx` | State, drag engine, add/delete/change, height, desktop canvas, mobile list |
| `src/components/bulletin/BulletinItem.tsx` | **deleted** (replaced by Frame + Image) |
| `src/app/api/bulletin/layout/route.ts` | Validate `{ items, board_height }`, wipe/reinsert, update settings |
| `src/app/api/bulletin/upload/route.ts` | Insert with explicit `type: "image"` |
| `src/app/bulletin/page.tsx`, `src/app/admin/bulletin/page.tsx` | Query items + settings, parse, pass `boardHeight` |

---

### Task 1: Types, options, and handwriting font

**Files:**
- Modify: `src/types/bulletin.ts`
- Create: `src/components/bulletin/noteOptions.ts`
- Create: `src/components/bulletin/handFont.ts`

- [ ] **Step 1: Replace `src/types/bulletin.ts` with the union type and row parser**

```ts
export type NoteFont = "circular" | "serif" | "hand" | "mono"

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

export type BulletinSettings = {
  board_height: number
}

const NOTE_FONT_VALUES: readonly NoteFont[] = ["circular", "serif", "hand", "mono"]

export function isNoteFont(value: unknown): value is NoteFont {
  return typeof value === "string" && (NOTE_FONT_VALUES as readonly string[]).includes(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function parseBase(row: Record<string, unknown>): BulletinItemBase | null {
  const { id, x, y, width, height, rotation, z_index, created_at } = row
  if (typeof id !== "string" || typeof created_at !== "string") return null
  if (![x, y, width, height, rotation, z_index].every(isFiniteNumber)) return null
  return {
    id,
    x: x as number,
    y: y as number,
    width: width as number,
    height: height as number,
    rotation: rotation as number,
    z_index: z_index as number,
    created_at,
  }
}

export function parseBulletinItem(row: Record<string, unknown>): BulletinItem | null {
  const base = parseBase(row)
  if (!base) return null

  const type = row.type ?? "image"

  if (type === "image") {
    if (typeof row.image_url !== "string" || row.image_url.length === 0) return null
    return { ...base, type: "image", image_url: row.image_url }
  }

  if (type === "text") {
    const { content, font, font_size, text_color, note_color } = row
    if (typeof content !== "string") return null
    if (!isNoteFont(font)) return null
    if (!isFiniteNumber(font_size)) return null
    if (typeof text_color !== "string" || typeof note_color !== "string") return null
    return { ...base, type: "text", content, font, font_size, text_color, note_color }
  }

  return null
}
```

- [ ] **Step 2: Create `src/components/bulletin/noteOptions.ts`**

```ts
import type { BulletinTextItem, NoteFont } from "@/types/bulletin"

export const NOTE_FONTS: Record<NoteFont, { label: string; css: string }> = {
  circular: { label: "Circular", css: "CircularXX, sans-serif" },
  serif: { label: "Serif", css: "Georgia, 'Times New Roman', serif" },
  hand: { label: "Handwritten", css: "var(--font-hand), cursive" },
  mono: { label: "Mono", css: "ui-monospace, Menlo, Consolas, monospace" },
}

export const NOTE_SIZES = [14, 18, 24, 32, 40, 48, 56, 72] as const

export const TEXT_COLORS = ["#111111", "#ffffff", "#8b1a1a", "#1a3a8b", "#1f5e2e", "#6b6b6b"] as const

export const NOTE_COLORS = ["#fff59d", "#f8bbd0", "#bbdefb", "#c8e6c9", "#ffcc80", "#ffffff"] as const

export const NOTE_DEFAULTS: Pick<
  BulletinTextItem,
  "font" | "font_size" | "text_color" | "note_color" | "width" | "height"
> = {
  font: "circular",
  font_size: 24,
  text_color: "#111111",
  note_color: "#fff59d",
  width: 260,
  height: 120,
}

export const IMAGE_LIMIT = 15
export const NOTE_LIMIT = 10

export const CANVAS_W = 1200

export const BOARD_HEIGHT = {
  min: 400,
  max: 3000,
  step: 100,
  default: 800,
  itemMargin: 40,
} as const

export const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i
```

- [ ] **Step 3: Create `src/components/bulletin/handFont.ts`**

```ts
import { Caveat } from "next/font/google"

export const handFont = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-hand",
  display: "swap",
})
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors only in `BulletinBoard.tsx`, `BulletinItem.tsx`, and `layout/route.ts` complaining that `image_url` does not exist on type `BulletinItem` (the union). No errors in the three files from this task. Those callers are fixed in Tasks 3, 5, and 8.

- [ ] **Step 5: Commit**

```bash
git add src/types/bulletin.ts src/components/bulletin/noteOptions.ts src/components/bulletin/handFont.ts
git commit -m "feat(bulletin): add text item union type, note options, and handwriting font"
```

---

### Task 2: Mobile reading-order helper

**Files:**
- Create: `src/components/bulletin/mobileOrder.ts`

- [ ] **Step 1: Create `src/components/bulletin/mobileOrder.ts`**

```ts
import type { BulletinImageItem, BulletinItem, BulletinTextItem } from "@/types/bulletin"

const ROW_TOLERANCE = 40

export type MobileBlock =
  | { kind: "note"; item: BulletinTextItem }
  | { kind: "images"; items: BulletinImageItem[] }

export function sortReadingOrder(items: BulletinItem[]): BulletinItem[] {
  const byY = [...items].sort((a, b) => a.y - b.y)
  const rows: BulletinItem[][] = []

  for (const item of byY) {
    const row = rows[rows.length - 1]
    if (row && item.y - row[0].y <= ROW_TOLERANCE) {
      row.push(item)
    } else {
      rows.push([item])
    }
  }

  return rows.flatMap((row) => [...row].sort((a, b) => a.x - b.x))
}

export function orderForMobile(items: BulletinItem[]): MobileBlock[] {
  const blocks: MobileBlock[] = []

  for (const item of sortReadingOrder(items)) {
    if (item.type === "text") {
      blocks.push({ kind: "note", item })
      continue
    }
    const last = blocks[blocks.length - 1]
    if (last && last.kind === "images") {
      last.items.push(item)
    } else {
      blocks.push({ kind: "images", items: [item] })
    }
  }

  return blocks
}
```

- [ ] **Step 2: Typecheck the new file in isolation**

Run: `npx tsc --noEmit 2>&1 | grep mobileOrder || echo "mobileOrder clean"`
Expected: `mobileOrder clean`

- [ ] **Step 3: Sanity-check the algorithm with a throwaway script**

Create `/tmp/mobile-order-check.mjs` (not committed):

```js
const items = [
  { id: "hdr", type: "text", x: 400, y: 20, content: "Youth" },
  { id: "a", type: "image", x: 100, y: 120 },
  { id: "b", type: "image", x: 400, y: 150 },
  { id: "c", type: "image", x: 700, y: 110 },
  { id: "hdr2", type: "text", x: 50, y: 500, content: "Missions" },
  { id: "d", type: "image", x: 200, y: 600 },
]
const ROW = 40
const byY = [...items].sort((a, b) => a.y - b.y)
const rows = []
for (const it of byY) {
  const r = rows[rows.length - 1]
  if (r && it.y - r[0].y <= ROW) r.push(it); else rows.push([it])
}
const ordered = rows.flatMap((r) => [...r].sort((a, b) => a.x - b.x))
console.log(ordered.map((i) => i.id).join(" "))
```

Run: `node /tmp/mobile-order-check.mjs`
Expected: `hdr a b c hdr2 d` — the header comes before its cluster, `a b c` are one row ordered by x despite y offsets of 110 to 150, and the second header precedes `d`.

- [ ] **Step 4: Commit**

```bash
git add src/components/bulletin/mobileOrder.ts
git commit -m "feat(bulletin): add reading-order helper for mobile layout"
```

---

### Task 3: Layout and upload API routes

**Files:**
- Modify: `src/app/api/bulletin/layout/route.ts`
- Modify: `src/app/api/bulletin/upload/route.ts`

- [ ] **Step 1: Replace `src/app/api/bulletin/layout/route.ts`**

```ts
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { isNoteFont, parseBulletinItem } from "@/types/bulletin"
import type { BulletinItem } from "@/types/bulletin"
import {
  BOARD_HEIGHT,
  HEX_COLOR_RE,
  IMAGE_LIMIT,
  NOTE_LIMIT,
  NOTE_SIZES,
} from "@/components/bulletin/noteOptions"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function supabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function validateItem(raw: unknown): BulletinItem | null {
  if (typeof raw !== "object" || raw === null) return null
  const item = parseBulletinItem(raw as Record<string, unknown>)
  if (!item) return null
  if (!UUID_RE.test(item.id)) return null
  if (item.type === "text") {
    if (!isNoteFont(item.font)) return null
    if (!(NOTE_SIZES as readonly number[]).includes(item.font_size)) return null
    if (!HEX_COLOR_RE.test(item.text_color) || !HEX_COLOR_RE.test(item.note_color)) return null
  }
  return item
}

function toRow(item: BulletinItem) {
  const base = {
    id: item.id,
    type: item.type,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    rotation: item.rotation,
    z_index: item.z_index,
    created_at: item.created_at,
  }
  if (item.type === "image") {
    return { ...base, image_url: item.image_url, content: null, font: null, font_size: null, text_color: null, note_color: null }
  }
  return {
    ...base,
    image_url: null,
    content: item.content,
    font: item.font,
    font_size: item.font_size,
    text_color: item.text_color,
    note_color: item.note_color,
  }
}

export async function GET() {
  const db = supabase()
  const [{ data: rows, error: itemsError }, { data: settings }] = await Promise.all([
    db.from("bulletin_items").select("*").order("created_at", { ascending: true }),
    db.from("bulletin_settings").select("board_height").eq("id", 1).maybeSingle(),
  ])

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  const items = (rows ?? [])
    .map((row) => parseBulletinItem(row as Record<string, unknown>))
    .filter((item): item is BulletinItem => item !== null)

  return NextResponse.json({ items, board_height: settings?.board_height ?? BOARD_HEIGHT.default })
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (!cookieStore.get("adminToken")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  const { items: rawItems, board_height } = body as { items?: unknown; board_height?: unknown }

  if (!Array.isArray(rawItems)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  if (
    typeof board_height !== "number" ||
    !Number.isInteger(board_height) ||
    board_height < BOARD_HEIGHT.min ||
    board_height > BOARD_HEIGHT.max
  ) {
    return NextResponse.json({ error: "Invalid board height" }, { status: 400 })
  }

  const items: BulletinItem[] = []
  for (const raw of rawItems) {
    const item = validateItem(raw)
    if (!item) return NextResponse.json({ error: "Invalid item" }, { status: 400 })
    items.push(item)
  }
  if (items.filter((i) => i.type === "image").length > IMAGE_LIMIT) {
    return NextResponse.json({ error: "Too many images" }, { status: 400 })
  }
  if (items.filter((i) => i.type === "text").length > NOTE_LIMIT) {
    return NextResponse.json({ error: "Too many notes" }, { status: 400 })
  }

  const db = supabase()

  const { error: deleteError } = await db
    .from("bulletin_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  // Note: delete is already committed; insert failure leaves the board empty.
  // Acceptable trade-off for this feature's scale.
  if (items.length > 0) {
    const { error: insertError } = await db.from("bulletin_items").insert(items.map(toRow))
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const { error: settingsError } = await db
    .from("bulletin_settings")
    .upsert({ id: 1, board_height })
  if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Count only images for the cap and insert an explicit `type` in `src/app/api/bulletin/upload/route.ts`**

The route currently counts every row toward the 15 limit, which would let notes consume image slots. Replace the block from `const db = supabase()` through the end of the file with:

```ts
  const db = supabase()
  const { count } = await db
    .from("bulletin_items")
    .select("id", { count: "exact", head: true })
    .eq("type", "image")
  if ((count ?? 0) >= IMAGE_LIMIT) {
    return NextResponse.json({ error: `Board is full (max ${IMAGE_LIMIT} images)` }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const blob = await put(`bulletin/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: false,
  })

  const rotation = Math.random() * 8 - 4
  const x = Math.round(CANVAS_W / 2 - DEFAULT_W / 2)
  const y = Math.round(CANVAS_H / 2 - DEFAULT_H / 2)

  const { data, error } = await db
    .from("bulletin_items")
    .insert({ type: "image", image_url: blob.url, x, y, width: DEFAULT_W, height: DEFAULT_H, rotation, z_index: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

And add this import at the top of the file, after the existing imports:

```ts
import { IMAGE_LIMIT } from "@/components/bulletin/noteOptions"
```

`CANVAS_W`, `CANVAS_H`, `DEFAULT_W`, and `DEFAULT_H` are constants already defined at the top of this file; leave them.

- [ ] **Step 3: Typecheck the two routes**

Run: `npx tsc --noEmit 2>&1 | grep 'api/bulletin' || echo "routes clean"`
Expected: `routes clean`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/bulletin/layout/route.ts src/app/api/bulletin/upload/route.ts
git commit -m "feat(bulletin): validate typed items and persist board height in layout route"
```

---

### Task 4: Pages read items and settings

**Files:**
- Modify: `src/app/bulletin/page.tsx`
- Modify: `src/app/admin/bulletin/page.tsx`

- [ ] **Step 1: Replace `src/app/bulletin/page.tsx`**

```tsx
import { createClient } from "@supabase/supabase-js"
import BulletinBoard from "@/components/bulletin/BulletinBoard"
import { BOARD_HEIGHT } from "@/components/bulletin/noteOptions"
import { parseBulletinItem } from "@/types/bulletin"
import type { BulletinItem } from "@/types/bulletin"

export const dynamic = "force-dynamic"

async function getBoard(): Promise<{ items: BulletinItem[]; boardHeight: number }> {
  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const [{ data: rows }, { data: settings }] = await Promise.all([
    db.from("bulletin_items").select("*").order("created_at", { ascending: true }),
    db.from("bulletin_settings").select("board_height").eq("id", 1).maybeSingle(),
  ])

  const items = (rows ?? [])
    .map((row) => parseBulletinItem(row as Record<string, unknown>))
    .filter((item): item is BulletinItem => item !== null)

  return { items, boardHeight: settings?.board_height ?? BOARD_HEIGHT.default }
}

export default async function BulletinPage() {
  const { items, boardHeight } = await getBoard()

  return (
    <div className="w-full pb-20">
      <div className="px-4 sm:px-8 pt-8 pb-5">
        <h1 className="text-2xl font-semibold tracking-widest uppercase mb-3">Announcements</h1>
        <p className="text-xs text-gray-400 tracking-widest uppercase">Current announcements</p>
      </div>
      <div className="px-4 sm:px-8">
        <BulletinBoard initialItems={items} initialBoardHeight={boardHeight} mode="view" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/app/admin/bulletin/page.tsx`**

```tsx
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import BulletinBoard from "@/components/bulletin/BulletinBoard"
import { BOARD_HEIGHT } from "@/components/bulletin/noteOptions"
import { parseBulletinItem } from "@/types/bulletin"
import type { BulletinItem } from "@/types/bulletin"

async function getBoard(): Promise<{ items: BulletinItem[]; boardHeight: number }> {
  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const [{ data: rows }, { data: settings }] = await Promise.all([
    db.from("bulletin_items").select("*").order("created_at", { ascending: true }),
    db.from("bulletin_settings").select("board_height").eq("id", 1).maybeSingle(),
  ])

  const items = (rows ?? [])
    .map((row) => parseBulletinItem(row as Record<string, unknown>))
    .filter((item): item is BulletinItem => item !== null)

  return { items, boardHeight: settings?.board_height ?? BOARD_HEIGHT.default }
}

export default async function AdminBulletinPage() {
  const cookieStore = await cookies()
  if (!cookieStore.get("adminToken")?.value) redirect("/login")

  const { items, boardHeight } = await getBoard()

  return (
    <div className="w-full">
      <BulletinBoard initialItems={items} initialBoardHeight={boardHeight} mode="edit" />
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep 'bulletin/page' || echo "pages clean"`
Expected: both pages report `initialBoardHeight` does not exist on `BulletinBoard` props. That is expected until Task 8; there must be no other errors in these two files.

- [ ] **Step 4: Commit**

```bash
git add src/app/bulletin/page.tsx src/app/admin/bulletin/page.tsx
git commit -m "feat(bulletin): pages load board height and parse typed items"
```

---

### Task 5: Split `BulletinItem` into `BulletinItemFrame` and `BulletinImage`

**Files:**
- Create: `src/components/bulletin/BulletinItemFrame.tsx`
- Create: `src/components/bulletin/BulletinImage.tsx`
- Delete: `src/components/bulletin/BulletinItem.tsx`

- [ ] **Step 1: Create `src/components/bulletin/BulletinItemFrame.tsx`**

This is the old `BulletinItem.tsx` with the `<img>` removed, a `children` slot added, a `lockAspect` prop that only changes the corner handle's cursor, and the corner handler renamed to `onCornerStart` (the board decides whether it is aspect-locked).

```tsx
"use client"

import type { BulletinItem } from "@/types/bulletin"

type Props = {
  item: BulletinItem
  mode: "view" | "edit"
  selected?: boolean
  lockAspect: boolean
  onSelect?: () => void
  onDelete?: () => void
  onDragStart?: (e: React.PointerEvent) => void
  onCornerStart?: (e: React.PointerEvent) => void
  onResizeHStart?: (e: React.PointerEvent) => void
  onResizeVStart?: (e: React.PointerEvent) => void
  onRotateStart?: (e: React.PointerEvent) => void
  onViewClick?: (rect: { x: number; y: number; width: number; height: number }) => void
  onDoubleClick?: () => void
  children: React.ReactNode
}

export default function BulletinItemFrame({
  item,
  mode,
  selected = false,
  lockAspect,
  onSelect,
  onDelete,
  onDragStart,
  onCornerStart,
  onResizeHStart,
  onResizeVStart,
  onRotateStart,
  onViewClick,
  onDoubleClick,
  children,
}: Props) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    zIndex: item.z_index,
    transform: `rotate(${item.rotation}deg)`,
    boxShadow: selected
      ? "0 0 0 1px #fff, 0 0 0 2.5px rgba(0,0,0,0.3), 4px 6px 16px rgba(0,0,0,0.45)"
      : "4px 6px 16px rgba(0,0,0,0.45)",
    borderRadius: 2,
    cursor: mode === "edit" ? "grab" : onViewClick ? "pointer" : "default",
    userSelect: "none",
    touchAction: "none",
  }

  const dot = (extra: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
    zIndex: 10,
    ...extra,
  })

  function handlePointerDown(e: React.PointerEvent) {
    if (mode === "edit") {
      onSelect?.()
      onDragStart?.(e)
    }
  }

  return (
    <div
      style={style}
      onPointerDown={handlePointerDown}
      onDoubleClick={mode === "edit" ? onDoubleClick : undefined}
      onClick={mode === "view" && onViewClick ? (e) => {
        const r = e.currentTarget.getBoundingClientRect()
        onViewClick({ x: r.x, y: r.y, width: r.width, height: r.height })
      } : undefined}
    >
      <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 2 }}>
        {children}
      </div>

      {/* Push pin — view mode only (edit mode uses the rotate handle in the same spot) */}
      {mode === "view" && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "radial-gradient(circle at 38% 35%, #e8e8e8, #888 55%, #555)",
            boxShadow: "0 2px 5px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.25)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      )}

      {mode === "edit" && selected && (
        <>
          <button
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              color: "#111",
              border: "none",
              fontSize: 13,
              lineHeight: 1,
              paddingTop: 2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
              transform: `rotate(${-item.rotation}deg)`,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete?.() }}
          >
            ×
          </button>

          <div
            style={dot({ top: -28, left: "50%", transform: "translateX(-50%)", cursor: "grab" })}
            onPointerDown={(e) => { e.stopPropagation(); onRotateStart?.(e) }}
          />

          <div
            style={dot({ right: -6, top: "50%", transform: "translateY(-50%)", cursor: "e-resize" })}
            onPointerDown={(e) => { e.stopPropagation(); onResizeHStart?.(e) }}
          />

          <div
            style={dot({ bottom: -6, left: "50%", transform: "translateX(-50%)", cursor: "s-resize" })}
            onPointerDown={(e) => { e.stopPropagation(); onResizeVStart?.(e) }}
          />

          <div
            style={dot({ bottom: -6, right: -6, cursor: lockAspect ? "se-resize" : "nwse-resize" })}
            onPointerDown={(e) => { e.stopPropagation(); onCornerStart?.(e) }}
          />
        </>
      )}
    </div>
  )
}
```

Note: `zIndex: item.z_index` is new. The old component ignored `z_index`; adding it makes the saved stacking order meaningful, which notes need so a header can sit on top of an image.

- [ ] **Step 2: Create `src/components/bulletin/BulletinImage.tsx`**

```tsx
"use client"

import type { BulletinImageItem } from "@/types/bulletin"

type Props = { item: BulletinImageItem }

const imageStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "fill", display: "block" }

export default function BulletinImage({ item }: Props) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item.image_url} alt="Announcement" style={imageStyle} draggable={false} />
}
```

- [ ] **Step 3: Delete the old component**

Run: `git rm -q src/components/bulletin/BulletinItem.tsx`

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E 'BulletinItemFrame|BulletinImage' || echo "frame clean"`
Expected: `frame clean`. `BulletinBoard.tsx` will fail on its import of the deleted file; Task 8 fixes it.

- [ ] **Step 5: Commit**

```bash
git add src/components/bulletin/BulletinItemFrame.tsx src/components/bulletin/BulletinImage.tsx
git commit -m "refactor(bulletin): split item wrapper into BulletinItemFrame and BulletinImage"
```

---

### Task 6: `BulletinNote` body with inline editing

**Files:**
- Create: `src/components/bulletin/BulletinNote.tsx`

- [ ] **Step 1: Create `src/components/bulletin/BulletinNote.tsx`**

```tsx
"use client"

import { useEffect, useRef } from "react"
import type { BulletinTextItem } from "@/types/bulletin"
import { NOTE_FONTS } from "./noteOptions"

type Props = {
  item: BulletinTextItem
  editing: boolean
  onChange: (content: string) => void
  onEndEdit: () => void
}

const PADDING = 12

export function noteTextStyle(item: BulletinTextItem): React.CSSProperties {
  return {
    fontFamily: NOTE_FONTS[item.font].css,
    fontSize: item.font_size,
    lineHeight: 1.25,
    color: item.text_color,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  }
}

export default function BulletinNote({ item, editing, onChange, onEndEdit }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editing) return
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [editing])

  const boxStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    padding: PADDING,
    boxSizing: "border-box",
    background: item.note_color,
    overflow: "hidden",
  }

  if (editing) {
    return (
      <div style={boxStyle}>
        <textarea
          ref={textareaRef}
          value={item.content}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onEndEdit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              onEndEdit()
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          spellCheck={false}
          style={{
            ...noteTextStyle(item),
            width: "100%",
            height: "100%",
            margin: 0,
            padding: 0,
            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",
            overflow: "hidden",
            userSelect: "text",
            cursor: "text",
          }}
        />
      </div>
    )
  }

  return (
    <div style={boxStyle}>
      <div style={noteTextStyle(item)}>{item.content}</div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep BulletinNote || echo "note clean"`
Expected: `note clean`

- [ ] **Step 3: Commit**

```bash
git add src/components/bulletin/BulletinNote.tsx
git commit -m "feat(bulletin): add BulletinNote body with inline textarea editing"
```

---

### Task 7: Format bar and toolbar

**Files:**
- Create: `src/components/bulletin/BulletinFormatBar.tsx`
- Modify: `src/components/bulletin/BulletinToolbar.tsx`

- [ ] **Step 1: Create `src/components/bulletin/BulletinFormatBar.tsx`**

```tsx
"use client"

import type { BulletinTextItem, NoteFont } from "@/types/bulletin"
import { NOTE_COLORS, NOTE_FONTS, NOTE_SIZES, TEXT_COLORS } from "./noteOptions"

type Props = {
  item: BulletinTextItem
  onChange: (patch: Partial<BulletinTextItem>) => void
}

const selectClass =
  "bg-gray-800 text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-gray-500"

function Swatches({
  label,
  colors,
  value,
  onPick,
}: {
  label: string
  colors: readonly string[]
  value: string
  onPick: (color: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-500 text-[10px] uppercase tracking-widest mr-1">{label}</span>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`${label} ${color}`}
          onClick={() => onPick(color)}
          className="w-5 h-5 rounded-sm border"
          style={{
            background: color,
            borderColor: value === color ? "#fff" : "#4b5563",
            boxShadow: value === color ? "0 0 0 2px #2563eb" : "none",
          }}
        />
      ))}
    </div>
  )
}

export default function BulletinFormatBar({ item, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-gray-900 border-b border-gray-700">
      <select
        aria-label="Font"
        className={selectClass}
        value={item.font}
        onChange={(e) => onChange({ font: e.target.value as NoteFont })}
      >
        {(Object.keys(NOTE_FONTS) as NoteFont[]).map((key) => (
          <option key={key} value={key}>{NOTE_FONTS[key].label}</option>
        ))}
      </select>

      <select
        aria-label="Font size"
        className={selectClass}
        value={item.font_size}
        onChange={(e) => onChange({ font_size: Number(e.target.value) })}
      >
        {NOTE_SIZES.map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>

      <Swatches label="Text" colors={TEXT_COLORS} value={item.text_color} onPick={(c) => onChange({ text_color: c })} />
      <Swatches label="Note" colors={NOTE_COLORS} value={item.note_color} onPick={(c) => onChange({ note_color: c })} />
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/components/bulletin/BulletinToolbar.tsx`**

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { BOARD_HEIGHT, IMAGE_LIMIT, NOTE_LIMIT } from "./noteOptions"

type Props = {
  imageCount: number
  noteCount: number
  saving: boolean
  boardHeight: number
  heightMessage: string | null
  onUpload: (file: File) => void
  onAddNote: () => void
  onBoardHeight: (next: number) => void
  onSave: () => void
}

const buttonBase = "px-3 py-1.5 text-xs font-semibold rounded text-white disabled:opacity-40 disabled:cursor-not-allowed"

export default function BulletinToolbar({
  imageCount,
  noteCount,
  saving,
  boardHeight,
  heightMessage,
  onUpload,
  onAddNote,
  onBoardHeight,
  onSave,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const imagesFull = imageCount >= IMAGE_LIMIT
  const notesFull = noteCount >= NOTE_LIMIT

  const [heightDraft, setHeightDraft] = useState(String(boardHeight))
  useEffect(() => { setHeightDraft(String(boardHeight)) }, [boardHeight])

  function commitDraft() {
    const parsed = Number.parseInt(heightDraft, 10)
    if (Number.isNaN(parsed)) {
      setHeightDraft(String(boardHeight))
      return
    }
    onBoardHeight(parsed)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700">
      <span className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
        Bulletin Admin
      </span>
      <span className="text-gray-600 text-xs ml-1">
        images {imageCount}/{IMAGE_LIMIT} · notes {noteCount}/{NOTE_LIMIT}
      </span>

      <div className="flex items-center gap-1 ml-4">
        <span className="text-gray-500 text-[10px] uppercase tracking-widest mr-1">Height</span>
        <button
          type="button"
          aria-label="Decrease board height"
          className="w-6 h-6 rounded bg-gray-800 text-gray-200 text-sm leading-none disabled:opacity-40"
          disabled={boardHeight <= BOARD_HEIGHT.min}
          onClick={() => onBoardHeight(boardHeight - BOARD_HEIGHT.step)}
        >
          −
        </button>
        <input
          aria-label="Board height"
          type="number"
          min={BOARD_HEIGHT.min}
          max={BOARD_HEIGHT.max}
          step={BOARD_HEIGHT.step}
          value={heightDraft}
          onChange={(e) => setHeightDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
          className="w-16 bg-gray-800 text-gray-100 text-xs text-center rounded px-1 py-1 border border-gray-700 focus:outline-none focus:border-gray-500"
        />
        <button
          type="button"
          aria-label="Increase board height"
          className="w-6 h-6 rounded bg-gray-800 text-gray-200 text-sm leading-none disabled:opacity-40"
          disabled={boardHeight >= BOARD_HEIGHT.max}
          onClick={() => onBoardHeight(boardHeight + BOARD_HEIGHT.step)}
        >
          +
        </button>
        {heightMessage && (
          <span className="text-amber-400 text-[11px] ml-2">{heightMessage}</span>
        )}
      </div>

      <div className="flex-1" />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ""
        }}
      />
      <button
        type="button"
        onClick={() => !imagesFull && inputRef.current?.click()}
        disabled={imagesFull}
        className={`${buttonBase} bg-blue-600 hover:bg-blue-700`}
      >
        {imagesFull ? "Images Full" : "+ Upload Image"}
      </button>
      <button
        type="button"
        onClick={onAddNote}
        disabled={notesFull}
        className={`${buttonBase} bg-yellow-600 hover:bg-yellow-700`}
      >
        {notesFull ? "Notes Full" : "+ Add Note"}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={`${buttonBase} bg-green-600 hover:bg-green-700 disabled:opacity-60`}
      >
        {saving ? "Saving…" : "Save Layout"}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E 'BulletinFormatBar|BulletinToolbar' || echo "toolbar clean"`
Expected: `toolbar clean`. (`BulletinBoard.tsx` will now complain about missing toolbar props; Task 8 fixes it.)

- [ ] **Step 4: Commit**

```bash
git add src/components/bulletin/BulletinFormatBar.tsx src/components/bulletin/BulletinToolbar.tsx
git commit -m "feat(bulletin): add format bar and toolbar controls for notes and board height"
```

---

### Task 8: `BulletinBoard` — state, notes, height, desktop canvas, mobile list

**Files:**
- Modify: `src/components/bulletin/BulletinBoard.tsx` (full rewrite)

- [ ] **Step 1: Replace `src/components/bulletin/BulletinBoard.tsx`**

```tsx
"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { BulletinImageItem, BulletinItem as Item, BulletinTextItem } from "@/types/bulletin"
import BulletinItemFrame from "./BulletinItemFrame"
import BulletinImage from "./BulletinImage"
import BulletinNote, { noteTextStyle } from "./BulletinNote"
import BulletinLightbox from "./BulletinLightbox"
import BulletinToolbar from "./BulletinToolbar"
import BulletinFormatBar from "./BulletinFormatBar"
import { orderForMobile } from "./mobileOrder"
import { handFont } from "./handFont"
import { BOARD_HEIGHT, CANVAS_W, NOTE_DEFAULTS, NOTE_LIMIT } from "./noteOptions"

type Props = {
  initialItems: Item[]
  initialBoardHeight: number
  mode: "view" | "edit"
}

type DragState = {
  type: "drag" | "resize" | "resize-free" | "resize-h" | "resize-v" | "rotate"
  itemId: string
  startPointerX: number
  startPointerY: number
  startItemX: number
  startItemY: number
  startItemW: number
  startItemH: number
  aspectRatio?: number
  centerViewportX?: number
  centerViewportY?: number
  startRotation?: number
}

const MIN_ITEM_SIZE = 80

const frameBackground = `
  repeating-linear-gradient(
    89deg,
    transparent 0px, transparent 3px,
    rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px
  ),
  repeating-linear-gradient(
    91deg,
    transparent 0px, transparent 7px,
    rgba(255,255,255,0.03) 7px, rgba(255,255,255,0.03) 8px
  ),
  linear-gradient(160deg, #6b4423 0%, #4a2f15 50%, #3a2310 100%)
`.replace(/\s+/g, " ").trim()

const corkboardStyle: React.CSSProperties = {
  background: "#181818",
  backgroundImage: "radial-gradient(circle, #252525 1px, transparent 1px)",
  backgroundSize: "20px 20px",
}

function isVisible(item: Item, mode: "view" | "edit"): boolean {
  if (mode === "edit") return true
  return item.type === "image" || item.content.trim().length > 0
}

function clampBoardHeight(requested: number, items: Item[]): { value: number; message: string | null } {
  const bounded = Math.min(BOARD_HEIGHT.max, Math.max(BOARD_HEIGHT.min, Math.round(requested)))
  const lowest = items.reduce((max, item) => Math.max(max, item.y + item.height), 0)
  const floor = lowest + BOARD_HEIGHT.itemMargin
  if (bounded < floor) {
    return {
      value: Math.min(BOARD_HEIGHT.max, floor),
      message: "Move or shrink the lowest item to go shorter.",
    }
  }
  return { value: bounded, message: null }
}

export default function BulletinBoard({ initialItems, initialBoardHeight, mode }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [boardHeight, setBoardHeight] = useState(initialBoardHeight)
  const [heightMessage, setHeightMessage] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lightboxOrigin, setLightboxOrigin] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const [scale, setScale] = useState(1)
  useEffect(() => {
    function updateScale() {
      if (containerRef.current) {
        setScale(containerRef.current.clientWidth / CANVAS_W)
      }
    }
    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [])

  const selectedItem = items.find((i) => i.id === selectedId) ?? null
  const selectedNote = selectedItem?.type === "text" ? selectedItem : null
  const imageCount = items.filter((i) => i.type === "image").length
  const noteCount = items.filter((i) => i.type === "text").length

  function select(id: string) {
    if (id !== selectedId) setEditingId(null)
    setSelectedId(id)
  }

  function handleCanvasClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      setSelectedId(null)
      setEditingId(null)
    }
  }

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const currentScale = containerRef.current
      ? containerRef.current.clientWidth / CANVAS_W
      : 1
    const dx = (e.clientX - drag.startPointerX) / currentScale
    const dy = (e.clientY - drag.startPointerY) / currentScale

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== drag.itemId) return item
        if (drag.type === "drag") {
          return { ...item, x: Math.round(drag.startItemX + dx), y: Math.round(drag.startItemY + dy) }
        }
        if (drag.type === "resize") {
          const newW = Math.max(MIN_ITEM_SIZE, Math.round(drag.startItemW + dx))
          const newH = Math.max(MIN_ITEM_SIZE, Math.round(newW / drag.aspectRatio!))
          return { ...item, width: newW, height: newH }
        }
        if (drag.type === "resize-free") {
          return {
            ...item,
            width: Math.max(MIN_ITEM_SIZE, Math.round(drag.startItemW + dx)),
            height: Math.max(MIN_ITEM_SIZE, Math.round(drag.startItemH + dy)),
          }
        }
        if (drag.type === "resize-h") {
          return { ...item, width: Math.max(MIN_ITEM_SIZE, Math.round(drag.startItemW + dx)) }
        }
        if (drag.type === "resize-v") {
          return { ...item, height: Math.max(MIN_ITEM_SIZE, Math.round(drag.startItemH + dy)) }
        }
        if (drag.type === "rotate") {
          const cx = drag.centerViewportX!
          const cy = drag.centerViewportY!
          const startAngle = Math.atan2(drag.startPointerY - cy, drag.startPointerX - cx)
          const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx)
          const delta = (currentAngle - startAngle) * (180 / Math.PI)
          return { ...item, rotation: Math.round(drag.startRotation! + delta) }
        }
        return item
      })
    )
  }, [])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
  }, [handlePointerMove])

  function startDrag(e: React.PointerEvent, item: Item, type: DragState["type"]) {
    if (editingId === item.id) return
    e.preventDefault()
    const container = containerRef.current
    const currentScale = container ? container.clientWidth / CANVAS_W : 1
    const canvasRect = container?.getBoundingClientRect()
    dragRef.current = {
      type,
      itemId: item.id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startItemX: item.x,
      startItemY: item.y,
      startItemW: item.width,
      startItemH: item.height,
      ...(type === "resize" && { aspectRatio: item.width / item.height }),
      ...(type === "rotate" && canvasRect && {
        centerViewportX: canvasRect.left + (item.x + item.width / 2) * currentScale,
        centerViewportY: canvasRect.top + (item.y + item.height / 2) * currentScale,
        startRotation: item.rotation,
      }),
    }
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  async function handleUpload(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/bulletin/upload", { method: "POST", body: formData })
    if (!res.ok) {
      const { error } = await res.json()
      alert(error)
      return
    }
    const row = await res.json()
    const newItem: BulletinImageItem = { ...row, type: "image" }

    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX_W = 260, MAX_H = 340
      const ratio = img.naturalWidth / img.naturalHeight
      let w = MAX_W
      let h = Math.round(w / ratio)
      if (h > MAX_H) { h = MAX_H; w = Math.round(h * ratio) }
      setItems((prev) => [...prev, { ...newItem, width: w, height: h }])
    }
    img.onerror = () => { URL.revokeObjectURL(url); setItems((prev) => [...prev, newItem]) }
    img.src = url
  }

  function handleAddNote() {
    if (noteCount >= NOTE_LIMIT) return
    const maxZ = items.reduce((max, item) => Math.max(max, item.z_index), 0)
    const note: BulletinTextItem = {
      id: crypto.randomUUID(),
      type: "text",
      content: "",
      font: NOTE_DEFAULTS.font,
      font_size: NOTE_DEFAULTS.font_size,
      text_color: NOTE_DEFAULTS.text_color,
      note_color: NOTE_DEFAULTS.note_color,
      width: NOTE_DEFAULTS.width,
      height: NOTE_DEFAULTS.height,
      x: Math.round((CANVAS_W - NOTE_DEFAULTS.width) / 2),
      y: Math.round((boardHeight - NOTE_DEFAULTS.height) / 2),
      rotation: 0,
      z_index: maxZ + 1,
      created_at: new Date().toISOString(),
    }
    setItems((prev) => [...prev, note])
    setSelectedId(note.id)
    setEditingId(note.id)
  }

  function handleNoteChange(id: string, patch: Partial<BulletinTextItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id && item.type === "text" ? { ...item, ...patch } : item))
    )
  }

  async function handleDelete(item: Item) {
    if (item.type === "image") {
      const res = await fetch(`/api/bulletin/delete/${item.id}`, { method: "DELETE" })
      if (!res.ok) return
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setSelectedId(null)
    setEditingId(null)
  }

  function handleBoardHeight(requested: number) {
    const { value, message } = clampBoardHeight(requested, items)
    setBoardHeight(value)
    setHeightMessage(message)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch("/api/bulletin/layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, board_height: boardHeight }),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Save failed" }))
      alert(error ?? "Save failed")
    }
  }

  const visibleItems = items.filter((item) => isVisible(item, mode))

  return (
    <div className={`w-full ${handFont.variable}`}>
      {mode === "edit" && (
        <>
          <BulletinToolbar
            imageCount={imageCount}
            noteCount={noteCount}
            saving={saving}
            boardHeight={boardHeight}
            heightMessage={heightMessage}
            onUpload={handleUpload}
            onAddNote={handleAddNote}
            onBoardHeight={handleBoardHeight}
            onSave={handleSave}
          />
          {selectedNote && (
            <BulletinFormatBar
              item={selectedNote}
              onChange={(patch) => handleNoteChange(selectedNote.id, patch)}
            />
          )}
        </>
      )}

      {/* Desktop: framed canvas */}
      <div
        className="hidden md:block"
        style={{
          padding: 16,
          background: frameBackground,
          boxShadow: "0 20px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div ref={containerRef} className="w-full" style={{ height: boardHeight * scale }}>
          <div
            style={{
              ...corkboardStyle,
              width: CANVAS_W,
              height: boardHeight,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              position: "relative",
            }}
            onClick={handleCanvasClick}
          >
            {visibleItems.map((item) => (
              <BulletinItemFrame
                key={item.id}
                item={item}
                mode={mode}
                selected={selectedId === item.id}
                lockAspect={item.type === "image"}
                onSelect={() => select(item.id)}
                onDelete={() => handleDelete(item)}
                onDragStart={(e) => startDrag(e, item, "drag")}
                onCornerStart={(e) => startDrag(e, item, item.type === "image" ? "resize" : "resize-free")}
                onResizeHStart={(e) => startDrag(e, item, "resize-h")}
                onResizeVStart={(e) => startDrag(e, item, "resize-v")}
                onRotateStart={(e) => startDrag(e, item, "rotate")}
                onDoubleClick={item.type === "text" ? () => setEditingId(item.id) : undefined}
                onViewClick={
                  item.type === "image"
                    ? (rect) => { setLightboxUrl(item.image_url); setLightboxOrigin(rect) }
                    : undefined
                }
              >
                {item.type === "image" ? (
                  <BulletinImage item={item} />
                ) : (
                  <BulletinNote
                    item={item}
                    editing={editingId === item.id}
                    onChange={(content) => handleNoteChange(item.id, { content })}
                    onEndEdit={() => setEditingId(null)}
                  />
                )}
              </BulletinItemFrame>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: reading-order list */}
      <div
        className="md:hidden"
        style={{
          padding: 8,
          background: frameBackground,
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div className="w-full p-4 flex flex-col gap-4" style={{ ...corkboardStyle, minHeight: 300 }}>
          {orderForMobile(visibleItems).map((block) =>
            block.kind === "note" ? (
              <div
                key={block.item.id}
                style={{
                  ...noteTextStyle(block.item),
                  fontSize: Math.max(14, Math.round(block.item.font_size * 0.7)),
                  background: block.item.note_color,
                  padding: 12,
                  borderRadius: 2,
                  boxShadow: "4px 6px 16px rgba(0,0,0,0.45)",
                  transform: `rotate(${Math.max(-4, Math.min(4, block.item.rotation))}deg)`,
                }}
              >
                {block.item.content}
              </div>
            ) : (
              <div key={block.items[0].id} className="grid grid-cols-2 gap-4">
                {block.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      transform: `rotate(${item.rotation}deg)`,
                      boxShadow: "4px 6px 16px rgba(0,0,0,0.45)",
                      borderRadius: 2,
                      overflow: "hidden",
                      aspectRatio: "3/4",
                      cursor: "pointer",
                    }}
                    onClick={mode === "view" ? () => setLightboxUrl(item.image_url) : undefined}
                  >
                    <BulletinImage item={item} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {lightboxUrl && (
        <BulletinLightbox
          imageUrl={lightboxUrl}
          originRect={lightboxOrigin}
          onClose={() => { setLightboxUrl(null); setLightboxOrigin(null) }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck and lint the whole project**

Run: `npx tsc --noEmit && npm run lint`
Expected: `tsc` prints nothing; lint ends with `✔ No ESLint warnings or errors`. This is the first task where the whole project should be clean, since every earlier task left `BulletinBoard.tsx` broken on purpose.

- [ ] **Step 3: Commit**

```bash
git add src/components/bulletin/BulletinBoard.tsx
git commit -m "feat(bulletin): add text notes, board height, and reading-order mobile list to board"
```

---

### Task 9: Database migration

**Files:** none in the repo. This runs in the Supabase dashboard SQL editor for the project that backs the site (the same project whose URL is in `.env.local` as `SUPABASE_URL`).

- [ ] **Step 1: Run the migration**

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

Expected: `Success. No rows returned` for the alters and create, `Success. 1 row inserted` for the insert.

- [ ] **Step 2: Confirm existing rows were backfilled**

```sql
select type, count(*) from bulletin_items group by type;
select * from bulletin_settings;
```

Expected: one row `image | <current item count>`; settings shows `1 | 800`.

- [ ] **Step 3: Record the migration in the repo**

Create `docs/superpowers/migrations/2026-09-12-bulletin-text-notes.sql` containing the exact SQL from Step 1, so the next environment can reproduce it. Commit:

```bash
git add docs/superpowers/migrations/2026-09-12-bulletin-text-notes.sql
git commit -m "docs(bulletin): record text notes and settings migration SQL"
```

---

### Task 10: Manual verification

**Files:** none.

- [ ] **Step 1: Start the dev server**

Run: `npx next dev -p 3001`
Expected: `✓ Ready` within a few seconds. Open `http://localhost:3001/admin/bulletin` (log in at `/login` first if redirected).

- [ ] **Step 2: Existing board unchanged**

Expected: previously uploaded images render at the same positions and sizes as before this branch. Counter reads `images N/15 · notes 0/10`. Height field reads `800`.

- [ ] **Step 3: Add and edit a note**

Click **+ Add Note**. Expected: a yellow 260×120 note appears centered, selected (white ring + handles), with a blinking cursor. Type `Youth Retreat`, press Enter, type `Sign-up closes Sunday`. Expected: two lines. Press Escape. Expected: textarea becomes static text with no visual shift. Double-click the note. Expected: editing resumes with the cursor at the end.

- [ ] **Step 4: Format bar**

With the note selected, the second toolbar row is visible. Change font to Handwritten. Expected: the note switches to the Caveat face. Change size to 40, text color to dark red, note color to blue. Expected: each change applies instantly. Click empty board. Expected: format bar disappears, note deselects.

- [ ] **Step 5: Handles on a note**

Select the note. Drag its body: it moves. Drag the top handle: it rotates. Drag the right handle: width only. Drag the bottom handle: height only. Drag the corner: width and height change independently (not aspect-locked). Select an image and drag its corner: aspect stays locked.

- [ ] **Step 6: Board height**

Click **+** three times. Expected: field shows `1100`, the dark canvas grows and the brown frame with it. Drag the note to the bottom of the canvas. Click **−** repeatedly. Expected: height stops at the note's bottom plus 40 and the amber message "Move or shrink the lowest item to go shorter." appears. Move the note up; press **−** again: message clears and height decreases. Type `250` in the field and press Enter. Expected: it snaps to `400`. Type `9999`: snaps to `3000`.

- [ ] **Step 7: Save and reload**

Click **Save Layout**. Expected: button reads Saving… then returns, no alert. Reload the page. Expected: note content, font, size, colors, position, rotation, and the board height all persist.

- [ ] **Step 8: Delete**

Add a second note, do not save, click its × . Expected: it disappears with no network error in the console. Delete the first (saved) note, Save, reload. Expected: it is gone.

- [ ] **Step 9: Public desktop**

Open `http://localhost:3001/bulletin` at 1440 wide. Expected: notes show with the pin, no handles; clicking a note does nothing; clicking an image opens the lightbox. Add a note in admin with empty content, save, and reload the public page. Expected: the empty note is not rendered.

- [ ] **Step 10: Public mobile**

In admin, place a header note above two images and a second note above one more image lower on the board, save. Resize the browser to 390 wide (or use device emulation). Expected: header note appears full-width, the two images in a two-column grid below it, then the second header, then the third image. Tilt on the header is subtle even if the desktop rotation was large.

- [ ] **Step 11: Tampered payload**

In the browser console on the admin page:

```js
fetch("/api/bulletin/layout", { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ items: [{ id: "00000000-0000-4000-8000-000000000000", type: "text", x: 0, y: 0, width: 100, height: 100, rotation: 0, z_index: 1, created_at: new Date().toISOString() }], board_height: 800 }) })
  .then((r) => r.status).then(console.log)
```

Expected: `400`. Reload admin: the board is unchanged.

- [ ] **Step 12: Commit any fixes found, then push and open the PR**

```bash
git push -u origin feature/bulletin-text-and-board-size
gh pr create --base main --title "feat: bulletin text notes and adjustable board height" --body "$(cat <<'EOF'
## Summary
- Sticky-note text items on the bulletin board: add, edit in place, move, resize, rotate; font, size, text color, note color
- Admin-adjustable board height (400–3000), persisted in a new `bulletin_settings` row
- Mobile view now orders items by board position so notes act as section headers

## Migration
Run `docs/superpowers/migrations/2026-09-12-bulletin-text-notes.sql` in the Supabase SQL editor **before** merging. Already applied to the current project.

## Spec
`docs/superpowers/specs/2026-09-12-bulletin-text-notes-and-board-height-design.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01L3QsgoxKTfuGvPqU6McHc2
EOF
)"
```

Then check the Vercel preview deployment for the PR repeats Steps 2, 7, 9 and 10.
