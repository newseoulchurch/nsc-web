import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
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

export default async function AdminBulletinPage() {
  const cookieStore = await cookies()
  if (!cookieStore.get("adminToken")?.value) redirect("/login")

  const items = await getItems()

  return (
    <div className="w-full">
      <BulletinBoard initialItems={items} mode="edit" />
    </div>
  )
}
