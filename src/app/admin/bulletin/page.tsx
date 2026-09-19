import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import BulletinBoard from "@/components/bulletin/BulletinBoard"
import { loadBoard } from "@/lib/bulletin"

export default async function AdminBulletinPage() {
  const cookieStore = await cookies()
  if (!cookieStore.get("adminToken")?.value) redirect("/login")

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { items, boardHeight } = await loadBoard(db)

  return (
    <div className="w-full">
      <BulletinBoard initialItems={items} initialBoardHeight={boardHeight} mode="edit" />
    </div>
  )
}
