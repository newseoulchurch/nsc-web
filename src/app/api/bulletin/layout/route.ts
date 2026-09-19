import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { parseBulletinItem } from "@/types/bulletin"
import type { BulletinItem } from "@/types/bulletin"
import { loadBoard } from "@/lib/bulletin"
import {
  BOARD_HEIGHT,
  HEX_COLOR_RE,
  IMAGE_LIMIT,
  NOTE_CONTENT_MAX,
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
  if (Number.isNaN(Date.parse(item.created_at))) return null
  if (!Number.isInteger(item.z_index)) return null
  if (item.type === "text") {
    if (item.content.length > NOTE_CONTENT_MAX) return null
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
  const { items, boardHeight } = await loadBoard(supabase())
  return NextResponse.json({ items, board_height: boardHeight })
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

  const lowest = items.reduce((max, i) => Math.max(max, i.y + i.height), 0)
  if (board_height < lowest + BOARD_HEIGHT.itemMargin) {
    return NextResponse.json({ error: "Board height too small for items" }, { status: 400 })
  }

  const db = supabase()

  // Note: the settings upsert runs before the delete-and-reinsert of items so that,
  // if something fails partway through, it's the board height (not the items) that
  // is left half-saved — the safer thing to have half-saved.
  // Acceptable trade-off for this feature's scale.
  const { error: settingsError } = await db
    .from("bulletin_settings")
    .upsert({ id: 1, board_height })
  if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 })

  const { error: deleteError } = await db
    .from("bulletin_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  if (items.length > 0) {
    const { error: insertError } = await db.from("bulletin_items").insert(items.map(toRow))
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
