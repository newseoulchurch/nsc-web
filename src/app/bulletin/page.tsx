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
