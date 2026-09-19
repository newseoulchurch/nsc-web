"use client"

import type { BulletinImageItem } from "@/types/bulletin"

type Props = { item: BulletinImageItem }

const imageStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "fill", display: "block" }

export default function BulletinImage({ item }: Props) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item.image_url} alt="Announcement" style={imageStyle} draggable={false} />
}
