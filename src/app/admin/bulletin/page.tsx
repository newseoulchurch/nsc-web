import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import BulletinBoard from "@/components/bulletin/BulletinBoard"
import type { BulletinItem } from "@/types/bulletin"

async function getItems(): Promise<BulletinItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/bulletin/layout`, {
    cache: "no-store",
  })
  if (!res.ok) return []
  return res.json()
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
