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
