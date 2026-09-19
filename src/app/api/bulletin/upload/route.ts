import { put } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { BOARD_HEIGHT, IMAGE_LIMIT } from "@/components/bulletin/noteOptions"

function supabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const MAX_BYTES = 10 * 1024 * 1024 // 10MB
const CANVAS_W = 1200
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

  const db = supabase()
  const [{ count }, { data: settings }] = await Promise.all([
    db.from("bulletin_items").select("id", { count: "exact", head: true }).eq("type", "image"),
    db.from("bulletin_settings").select("board_height").eq("id", 1).maybeSingle(),
  ])
  if ((count ?? 0) >= IMAGE_LIMIT) {
    return NextResponse.json({ error: `Board is full (max ${IMAGE_LIMIT} images)` }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const blob = await put(`bulletin/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: false,
  })

  const boardHeight = settings?.board_height ?? BOARD_HEIGHT.default
  const rotation = Math.random() * 8 - 4
  const x = Math.round(CANVAS_W / 2 - DEFAULT_W / 2)
  const y = Math.round(boardHeight / 2 - DEFAULT_H / 2)

  const { data, error } = await db
    .from("bulletin_items")
    .insert({ type: "image", image_url: blob.url, x, y, width: DEFAULT_W, height: DEFAULT_H, rotation, z_index: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
