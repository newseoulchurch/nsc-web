# Announcement Bulletin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a virtual cork board at `/bulletin` where admins upload and freely position event poster images, and visitors can view and fullscreen them.

**Architecture:** Supabase stores item metadata (position, size, rotation), Vercel Blob stores the image files. A shared `BulletinBoard` component renders in either `view` or `edit` mode. The admin canvas uses pointer events for drag and resize with no external library.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind, `@supabase/supabase-js`, `@vercel/blob`

**Branch:** `feature/announcement-bulletin` (create from `main` or `develop`)

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `src/types/bulletin.ts` | `BulletinItem` type |
| Create | `src/app/api/bulletin/layout/route.ts` | GET + POST layout |
| Create | `src/app/api/bulletin/upload/route.ts` | Image upload → Blob + Supabase insert |
| Create | `src/app/api/bulletin/delete/[id]/route.ts` | Delete item from Supabase + Blob |
| Create | `src/components/bulletin/BulletinLightbox.tsx` | Fullscreen overlay |
| Create | `src/components/bulletin/BulletinItem.tsx` | Single poster card (view + edit modes) |
| Create | `src/components/bulletin/BulletinBoard.tsx` | Canvas — renders items, owns edit state |
| Create | `src/components/bulletin/BulletinToolbar.tsx` | Admin Upload + Save bar |
| Create | `src/app/bulletin/page.tsx` | Public page |
| Create | `src/app/admin/bulletin/page.tsx` | Admin page |
| Modify | `src/components/layout/Header.tsx` | Add BULLETIN to public + admin nav |
| Modify | `src/app/admin/page.tsx` | Add bulletin link to admin dashboard |

---

## Task 1: Create Supabase Table

**Files:**
- No source files — run SQL against Supabase directly

- [ ] **Step 1: Create the table via Python**

```bash
python3 -c "
import psycopg2
conn = psycopg2.connect('postgres://postgres.tlbhbtfsgtvocqagvamo:AMKK63SGhkhlIr5d@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require')
cur = conn.cursor()
cur.execute('''
  CREATE TABLE IF NOT EXISTS bulletin_items (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url  text NOT NULL,
    x          integer NOT NULL DEFAULT 100,
    y          integer NOT NULL DEFAULT 100,
    width      integer NOT NULL DEFAULT 220,
    height     integer NOT NULL DEFAULT 280,
    rotation   real NOT NULL DEFAULT 0,
    z_index    integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  )
''')
conn.commit()
print('bulletin_items created')
cur.execute(\"SELECT column_name FROM information_schema.columns WHERE table_name = 'bulletin_items' ORDER BY ordinal_position\")
print([r[0] for r in cur.fetchall()])
conn.close()
"
```

Expected output:
```
bulletin_items created
['id', 'image_url', 'x', 'y', 'width', 'height', 'rotation', 'z_index', 'created_at']
```

- [ ] **Step 2: Commit**

```bash
git checkout -b feature/announcement-bulletin
git commit --allow-empty -m "feat: create bulletin_items Supabase table"
```

---

## Task 2: Type Definition

**Files:**
- Create: `src/types/bulletin.ts`

- [ ] **Step 1: Create the type**

```ts
// src/types/bulletin.ts
export type BulletinItem = {
  id: string
  image_url: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  z_index: number
  created_at: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/bulletin.ts
git commit -m "feat: add BulletinItem type"
```

---

## Task 3: GET + POST Layout API

**Files:**
- Create: `src/app/api/bulletin/layout/route.ts`

The GET returns all items ordered by `created_at`. The POST replaces the full layout — it deletes all existing rows and re-inserts the current state. This avoids partial-update complexity.

- [ ] **Step 1: Create the route**

```ts
// src/app/api/bulletin/layout/route.ts
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import type { BulletinItem } from "@/types/bulletin"

function supabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const { data, error } = await supabase()
    .from("bulletin_items")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (!cookieStore.get("adminToken")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const items: BulletinItem[] = await request.json()
  const db = supabase()

  const { error: deleteError } = await db.from("bulletin_items").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  if (items.length > 0) {
    const { error: insertError } = await db.from("bulletin_items").insert(
      items.map(({ id, image_url, x, y, width, height, rotation, z_index, created_at }) => ({
        id, image_url, x, y, width, height, rotation, z_index, created_at,
      }))
    )
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify GET returns empty array**

Start dev server (`npm run dev`) and run:
```bash
curl http://localhost:3000/api/bulletin/layout
```
Expected: `[]`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bulletin/layout/route.ts
git commit -m "feat: add GET + POST /api/bulletin/layout"
```

---

## Task 4: Upload API

**Files:**
- Create: `src/app/api/bulletin/upload/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/bulletin/upload/route.ts
import { put } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

function supabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const MAX_BYTES = 10 * 1024 * 1024 // 10MB
const CANVAS_W = 1200
const CANVAS_H = 800
const DEFAULT_W = 220
const DEFAULT_H = 280

export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (!cookieStore.get("adminToken")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 })
  }

  // Check current item count
  const db = supabase()
  const { count } = await db.from("bulletin_items").select("id", { count: "exact", head: true })
  if ((count ?? 0) >= 15) {
    return NextResponse.json({ error: "Board is full (max 15 items)" }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const blob = await put(`bulletin/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: false,
  })

  // Random rotation between -4 and +4 degrees
  const rotation = Math.random() * 8 - 4

  // Center of canvas minus half default size
  const x = Math.round(CANVAS_W / 2 - DEFAULT_W / 2)
  const y = Math.round(CANVAS_H / 2 - DEFAULT_H / 2)

  const { data, error } = await db
    .from("bulletin_items")
    .insert({ image_url: blob.url, x, y, width: DEFAULT_W, height: DEFAULT_H, rotation, z_index: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/bulletin/upload/route.ts
git commit -m "feat: add POST /api/bulletin/upload"
```

---

## Task 5: Delete API

**Files:**
- Create: `src/app/api/bulletin/delete/[id]/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/bulletin/delete/[id]/route.ts
import { del } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

function supabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  if (!cookieStore.get("adminToken")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const db = supabase()

  const { data, error } = await db
    .from("bulletin_items")
    .delete()
    .eq("id", id)
    .select("image_url")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await del(data.image_url)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/bulletin/delete/[id]/route.ts
git commit -m "feat: add DELETE /api/bulletin/delete/[id]"
```

---

## Task 6: BulletinLightbox Component

**Files:**
- Create: `src/components/bulletin/BulletinLightbox.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/bulletin/BulletinLightbox.tsx
"use client"

import { useEffect } from "react"

type Props = {
  imageUrl: string
  onClose: () => void
}

export default function BulletinLightbox({ imageUrl, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white text-lg hover:bg-white/20"
        onClick={onClose}
      >
        ×
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Announcement poster"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/bulletin/BulletinLightbox.tsx
git commit -m "feat: add BulletinLightbox component"
```

---

## Task 7: BulletinItem Component

**Files:**
- Create: `src/components/bulletin/BulletinItem.tsx`

This component renders one poster card. In `view` mode it opens the lightbox on click. In `edit` mode it shows selection outline, delete button, and resize handle — interactions are wired in Task 10.

- [ ] **Step 1: Create the component**

```tsx
// src/components/bulletin/BulletinItem.tsx
"use client"

import type { BulletinItem as Item } from "@/types/bulletin"

type Props = {
  item: Item
  mode: "view" | "edit"
  selected?: boolean
  onSelect?: () => void
  onDelete?: () => void
  onDragStart?: (e: React.PointerEvent) => void
  onResizeStart?: (e: React.PointerEvent) => void
  onViewClick?: () => void
}

export default function BulletinItem({
  item,
  mode,
  selected = false,
  onSelect,
  onDelete,
  onDragStart,
  onResizeStart,
  onViewClick,
}: Props) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    transform: `rotate(${item.rotation}deg)`,
    boxShadow: selected
      ? "0 0 0 2px #3182ce, 4px 6px 16px rgba(0,0,0,0.45)"
      : "4px 6px 16px rgba(0,0,0,0.45)",
    borderRadius: 2,
    overflow: "hidden",
    cursor: mode === "edit" ? "grab" : "pointer",
    userSelect: "none",
    touchAction: "none",
  }

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
      onClick={mode === "view" ? onViewClick : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt="Announcement"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        draggable={false}
      />

      {mode === "edit" && selected && (
        <>
          {/* Delete button */}
          <button
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#e53e3e",
              color: "white",
              border: "none",
              fontSize: 14,
              lineHeight: 1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.()
            }}
          >
            ×
          </button>

          {/* Resize handle */}
          <div
            style={{
              position: "absolute",
              bottom: -6,
              right: -6,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#3182ce",
              cursor: "se-resize",
              zIndex: 10,
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              onResizeStart?.(e)
            }}
          />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/bulletin/BulletinItem.tsx
git commit -m "feat: add BulletinItem component"
```

---

## Task 8: BulletinToolbar Component

**Files:**
- Create: `src/components/bulletin/BulletinToolbar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/bulletin/BulletinToolbar.tsx
"use client"

import { useRef } from "react"

type Props = {
  itemCount: number
  saving: boolean
  onUpload: (file: File) => void
  onSave: () => void
}

export default function BulletinToolbar({ itemCount, saving, onUpload, onSave }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const atLimit = itemCount >= 15

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700">
      <span className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
        Bulletin Admin
      </span>
      <span className="text-gray-600 text-xs ml-1">{itemCount}/15</span>
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
        onClick={() => !atLimit && inputRef.current?.click()}
        disabled={atLimit}
        className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {atLimit ? "Board Full" : "+ Upload Image"}
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-3 py-1.5 text-xs font-semibold rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Layout"}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/bulletin/BulletinToolbar.tsx
git commit -m "feat: add BulletinToolbar component"
```

---

## Task 9: BulletinBoard Component

**Files:**
- Create: `src/components/bulletin/BulletinBoard.tsx`

This is the main component. It owns all state: items, selected item, lightbox, drag/resize. The 1200×800 canvas scales to fit its container via `transform: scale(scaleX)`.

- [ ] **Step 1: Create the component**

```tsx
// src/components/bulletin/BulletinBoard.tsx
"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { BulletinItem as Item } from "@/types/bulletin"
import BulletinItemComp from "./BulletinItem"
import BulletinLightbox from "./BulletinLightbox"
import BulletinToolbar from "./BulletinToolbar"

const CANVAS_W = 1200
const CANVAS_H = 800

type Props = {
  initialItems: Item[]
  mode: "view" | "edit"
}

type DragState = {
  type: "drag" | "resize"
  itemId: string
  startPointerX: number
  startPointerY: number
  startItemX: number
  startItemY: number
  startItemW: number
  startItemH: number
}

export default function BulletinBoard({ initialItems, mode }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  // Scale canvas to container width
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

  // Deselect on canvas background click
  function handleCanvasClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) setSelectedId(null)
  }

  // Drag + resize via pointer events on window
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
        } else {
          return {
            ...item,
            width: Math.max(80, Math.round(drag.startItemW + dx)),
            height: Math.max(80, Math.round(drag.startItemH + dy)),
          }
        }
      })
    )
  }, [])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
  }, [handlePointerMove])

  function startDrag(e: React.PointerEvent, item: Item, type: "drag" | "resize") {
    e.preventDefault()
    dragRef.current = {
      type,
      itemId: item.id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startItemX: item.x,
      startItemY: item.y,
      startItemW: item.width,
      startItemH: item.height,
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
    const newItem: Item = await res.json()
    setItems((prev) => [...prev, newItem])
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/bulletin/delete/${id}`, { method: "DELETE" })
    if (!res.ok) return
    setItems((prev) => prev.filter((i) => i.id !== id))
    setSelectedId(null)
  }

  async function handleSave() {
    setSaving(true)
    await fetch("/api/bulletin/layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    })
    setSaving(false)
  }

  return (
    <div className="w-full">
      {mode === "edit" && (
        <BulletinToolbar
          itemCount={items.length}
          saving={saving}
          onUpload={handleUpload}
          onSave={handleSave}
        />
      )}

      {/* Desktop: scaled canvas */}
      <div ref={containerRef} className="hidden md:block w-full" style={{ height: CANVAS_H * scale }}>
        <div
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            position: "relative",
            background: "#c4a06a",
            backgroundImage:
              "repeating-linear-gradient(45deg, #8b6914 0, #8b6914 1px, transparent 0, transparent 50%)",
            backgroundSize: "6px 6px",
          }}
          onClick={handleCanvasClick}
        >
          {/* Cork texture overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.22,
              backgroundImage:
                "repeating-linear-gradient(45deg, #8b6914 0, #8b6914 1px, transparent 0, transparent 50%)",
              backgroundSize: "6px 6px",
              pointerEvents: "none",
            }}
          />
          {items.map((item) => (
            <BulletinItemComp
              key={item.id}
              item={item}
              mode={mode}
              selected={selectedId === item.id}
              onSelect={() => setSelectedId(item.id)}
              onDelete={() => handleDelete(item.id)}
              onDragStart={(e) => startDrag(e, item, "drag")}
              onResizeStart={(e) => startDrag(e, item, "resize")}
              onViewClick={() => setLightboxUrl(item.image_url)}
            />
          ))}
        </div>
      </div>

      {/* Mobile: 2-column grid */}
      <div
        className="md:hidden w-full p-4"
        style={{
          background: "#c4a06a",
          backgroundImage:
            "repeating-linear-gradient(45deg, #8b6914 0, #8b6914 1px, transparent 0, transparent 50%)",
          backgroundSize: "6px 6px",
          minHeight: 300,
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          {[...items]
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((item, i) => (
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
                onClick={() => setLightboxUrl(item.image_url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt="Announcement"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
        </div>
      </div>

      {lightboxUrl && (
        <BulletinLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/bulletin/BulletinBoard.tsx
git commit -m "feat: add BulletinBoard component with drag/resize/lightbox/mobile"
```

---

## Task 10: Public Page

**Files:**
- Create: `src/app/bulletin/page.tsx`

Server component — fetches layout at request time (no caching so it's always fresh).

- [ ] **Step 1: Create the page**

```tsx
// src/app/bulletin/page.tsx
import BulletinBoard from "@/components/bulletin/BulletinBoard"
import type { BulletinItem } from "@/types/bulletin"

async function getItems(): Promise<BulletinItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/bulletin/layout`, {
    cache: "no-store",
  })
  if (!res.ok) return []
  return res.json()
}

export default async function BulletinPage() {
  const items = await getItems()

  return (
    <div className="w-full">
      <div className="px-4 sm:px-[85px] py-8">
        <h1 className="text-2xl font-bold tracking-widest uppercase mb-1">Announcements</h1>
        <p className="text-sm text-gray-500 mb-6">Click any poster to view full size</p>
      </div>
      <BulletinBoard initialItems={items} mode="view" />
    </div>
  )
}
```

- [ ] **Step 2: Add `NEXT_PUBLIC_SITE_URL` to `.env.local` if missing**

```bash
grep -q NEXT_PUBLIC_SITE_URL /Users/chan/github/nsc-web/.env.local || echo 'NEXT_PUBLIC_SITE_URL=http://localhost:3000' >> /Users/chan/github/nsc-web/.env.local
```

- [ ] **Step 3: Visit `http://localhost:3000/bulletin`**

Expected: page renders with empty cork board (no items yet).

- [ ] **Step 4: Commit**

```bash
git add src/app/bulletin/page.tsx
git commit -m "feat: add public /bulletin page"
```

---

## Task 11: Admin Page

**Files:**
- Create: `src/app/admin/bulletin/page.tsx`

Server component checks the admin cookie, then renders `BulletinBoard` in edit mode.

- [ ] **Step 1: Create the page**

```tsx
// src/app/admin/bulletin/page.tsx
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import BulletinBoard from "@/components/bulletin/BulletinBoard"
import type { BulletinItem } from "@/types/bulletin"

async function getItems(): Promise<BulletinItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/bulletin/layout`, {
    cache: "no-store",
  })
  if (!res.ok) return []
  return res.json()
}

export default async function AdminBulletinPage() {
  const cookieStore = await cookies()
  if (!cookieStore.get("adminToken")?.value) redirect("/login")

  const items = await getItems()

  return (
    <div className="w-full">
      <BulletinBoard initialItems={items} mode="edit" />
    </div>
  )
}
```

- [ ] **Step 2: Visit `http://localhost:3000/admin/bulletin`** (while logged in as admin)

Expected: cork board with toolbar (Upload Image + Save Layout buttons). No items yet.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/bulletin/page.tsx
git commit -m "feat: add admin /admin/bulletin page"
```

---

## Task 12: Navigation + Admin Dashboard Link

**Files:**
- Modify: `src/components/layout/Header.tsx:25-38`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add to public nav in Header.tsx**

In `src/components/layout/Header.tsx`, find the `navLinks` array and add `BULLETIN` after `WALL OF FAITH`:

```ts
const navLinks = [
  { href: "/visit", label: "VISIT US" },
  { href: "/beliefs", label: "OUR BELIEFS" },
  { href: "/about", label: "ABOUT US" },
  { href: "/wall-of-faith", label: "WALL OF FAITH" },
  { href: "/bulletin", label: "BULLETIN" },   // ← add this
  { href: "/events", label: "EVENTS" },
  { href: "/life-group", label: "LIFE GROUP" },
  { href: "/sermon", label: "SERMON SERIES" },
]
```

- [ ] **Step 2: Add to admin nav in Header.tsx**

```ts
const adminNavLinks = [
  { href: "/admin/events", label: "이벤트 관리" },
  { href: "/admin/weekly-paper", label: "주보 관리" },
  { href: "/admin/home-video", label: "홈 화면 영상 설정" },
  { href: "/admin/wall-of-faith", label: "Wall of Faith 관리" },
  { href: "/admin/bulletin", label: "게시판 관리" },   // ← add this
]
```

- [ ] **Step 3: Add link to admin dashboard**

In `src/app/admin/page.tsx`, add a link alongside the existing ones:

```tsx
<a href="/admin/bulletin" className="underline text-blue-500">
  게시판 관리
</a>
```

- [ ] **Step 4: Verify nav**

Visit `http://localhost:3000` — open hamburger menu — confirm BULLETIN appears between WALL OF FAITH and EVENTS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Header.tsx src/app/admin/page.tsx
git commit -m "feat: add Bulletin nav links and admin dashboard entry"
```

---

## Task 13: End-to-End Test

Manual test — no automated test framework in this project.

- [ ] **Step 1: Upload a poster as admin**

1. Log in at `http://localhost:3000/login`
2. Go to `http://localhost:3000/admin/bulletin`
3. Click **Upload Image**, select any image file
4. Confirm: image appears on the cork board at center, slightly rotated, with drop shadow

- [ ] **Step 2: Drag and resize**

1. Click the poster — blue outline + delete × + resize handle appear
2. Drag the poster — it moves to the new position
3. Drag the resize handle — it resizes
4. Click the canvas background — deselects

- [ ] **Step 3: Save and reload**

1. Click **Save Layout**
2. Hard refresh `http://localhost:3000/admin/bulletin`
3. Confirm poster is in the saved position

- [ ] **Step 4: Public view**

1. Visit `http://localhost:3000/bulletin`
2. Confirm poster is visible at its saved position
3. Click the poster — lightbox opens with full-size image
4. Click × or press Escape — lightbox closes

- [ ] **Step 5: Delete**

1. Go back to `/admin/bulletin`
2. Click poster → click ×
3. Confirm poster disappears
4. Click **Save Layout**
5. Reload — confirms deletion persisted

- [ ] **Step 6: Mobile**

Resize browser to < 768px width (or use DevTools mobile view).
Confirm posters render in a 2-column grid on the cork board background.

- [ ] **Step 7: Final commit**

```bash
git push -u origin feature/announcement-bulletin
```
