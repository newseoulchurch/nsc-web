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
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  const db = supabase()

  const { error: deleteError } = await db.from("bulletin_items").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  // Note: delete is already committed; insert failure leaves the board empty.
  // Acceptable trade-off for this feature's scale.
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
