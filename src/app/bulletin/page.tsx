import BulletinBoard from "@/components/bulletin/BulletinBoard"
import type { BulletinItem } from "@/types/bulletin"

async function getItems(): Promise<BulletinItem[]> {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
  const res = await fetch(`${base}/api/bulletin/layout`, {
    cache: "no-store",
  })
  if (!res.ok) return []
  return res.json()
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
