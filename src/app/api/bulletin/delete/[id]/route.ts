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
