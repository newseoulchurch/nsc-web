import type { BulletinImageItem, BulletinItem, BulletinTextItem } from "@/types/bulletin"

const ROW_TOLERANCE = 40

export type MobileBlock =
  | { kind: "note"; item: BulletinTextItem }
  | { kind: "images"; items: BulletinImageItem[] }

export function sortReadingOrder(items: BulletinItem[]): BulletinItem[] {
  const byY = [...items].sort((a, b) => a.y - b.y)
  const rows: BulletinItem[][] = []

  for (const item of byY) {
    const row = rows[rows.length - 1]
    if (row && item.y - row[0].y <= ROW_TOLERANCE) {
      row.push(item)
    } else {
      rows.push([item])
    }
  }

  return rows.flatMap((row) => [...row].sort((a, b) => a.x - b.x))
}

export function orderForMobile(items: BulletinItem[]): MobileBlock[] {
  const blocks: MobileBlock[] = []

  for (const item of sortReadingOrder(items)) {
    if (item.type === "text") {
      blocks.push({ kind: "note", item })
      continue
    }
    const last = blocks[blocks.length - 1]
    if (last && last.kind === "images") {
      last.items.push(item)
    } else {
      blocks.push({ kind: "images", items: [item] })
    }
  }

  return blocks
}
