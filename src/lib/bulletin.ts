import type { SupabaseClient } from "@supabase/supabase-js"
import { BOARD_HEIGHT } from "@/components/bulletin/noteOptions"
import { parseBulletinItem } from "@/types/bulletin"
import type { BulletinItem } from "@/types/bulletin"

export async function loadBoard(db: SupabaseClient): Promise<{ items: BulletinItem[]; boardHeight: number }> {
  const [{ data: rows }, { data: settings }] = await Promise.all([
    db.from("bulletin_items").select("*").order("created_at", { ascending: true }),
    db.from("bulletin_settings").select("board_height").eq("id", 1).maybeSingle(),
  ])

  const items = (rows ?? [])
    .map((row) => parseBulletinItem(row as Record<string, unknown>))
    .filter((item): item is BulletinItem => item !== null)

  return { items, boardHeight: settings?.board_height ?? BOARD_HEIGHT.default }
}
