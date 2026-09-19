import { createClient } from "@supabase/supabase-js"
import BulletinBoard from "@/components/bulletin/BulletinBoard"
import { loadBoard } from "@/lib/bulletin"

export const dynamic = "force-dynamic"

export default async function BulletinPage() {
  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { items, boardHeight } = await loadBoard(db)

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
