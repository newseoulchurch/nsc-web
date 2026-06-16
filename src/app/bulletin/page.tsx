import BulletinBoard from "@/components/bulletin/BulletinBoard"
import type { BulletinItem } from "@/types/bulletin"

async function getItems(): Promise<BulletinItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/bulletin/layout`, {
    cache: "no-store",
  })
  if (!res.ok) return []
  return res.json()
}

export default async function BulletinPage() {
  const items = await getItems()

  return (
    <div className="w-full">
      <div className="px-4 sm:px-[85px] py-8">
        <h1 className="text-2xl font-bold tracking-widest uppercase mb-1">Announcements</h1>
        <p className="text-sm text-gray-500 mb-6">Click any poster to view full size</p>
      </div>
      <BulletinBoard initialItems={items} mode="view" />
    </div>
  )
}
