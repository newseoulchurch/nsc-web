"use client"

import type { BulletinItem, Mode } from "@/types/bulletin"
import BulletinImage from "./BulletinImage"
import { noteTextStyle } from "./BulletinNote"
import { orderForMobile } from "./mobileOrder"

type Props = {
  items: BulletinItem[]
  mode: Mode
  onOpenImage: (url: string) => void
}

export default function BulletinMobileList({ items, mode, onOpenImage }: Props) {
  return (
    <>
      {orderForMobile(items).map((block) =>
        block.kind === "note" ? (
          <div
            key={block.item.id}
            style={{
              ...noteTextStyle(block.item),
              fontSize: Math.max(14, Math.round(block.item.font_size * 0.7)),
              background: block.item.note_color,
              padding: 12,
              borderRadius: 2,
              boxShadow: "4px 6px 16px rgba(0,0,0,0.45)",
              transform: `rotate(${Math.max(-4, Math.min(4, block.item.rotation))}deg)`,
            }}
          >
            {block.item.content}
          </div>
        ) : (
          <div key={block.items[0].id} className="grid grid-cols-2 gap-4">
            {block.items.map((item) => (
              <div
                key={item.id}
                style={{
                  transform: `rotate(${item.rotation}deg)`,
                  boxShadow: "4px 6px 16px rgba(0,0,0,0.45)",
                  borderRadius: 2,
                  overflow: "hidden",
                  aspectRatio: "3/4",
                  cursor: "pointer",
                }}
                onClick={mode === "view" ? () => onOpenImage(item.image_url) : undefined}
              >
                <BulletinImage item={item} />
              </div>
            ))}
          </div>
        )
      )}
    </>
  )
}
