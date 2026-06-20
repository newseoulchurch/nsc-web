import { createClient } from "@supabase/supabase-js"
import BulletinBoard from "@/components/bulletin/BulletinBoard"
import type { BulletinItem } from "@/types/bulletin"

async function getItems(): Promise<BulletinItem[]> {
  const { data, error } = await createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
    .from("bulletin_items")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) return []
  return data
}

export default async function BulletinPage() {
  const items = await getItems()

  return (
    <div className="w-full pb-20">
      <div className="px-4 sm:px-8 pt-8 pb-5">
        <h1 className="text-2xl font-semibold tracking-widest uppercase mb-3">Announcements</h1>
        <p className="text-xs text-gray-400 tracking-widest uppercase">Current announcements</p>
      </div>
      <div className="px-4 sm:px-8">
        <BulletinBoard initialItems={items} mode="view" />
      </div>
    </div>
  )
}
