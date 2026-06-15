"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { BulletinItem as Item } from "@/types/bulletin"
import BulletinItemComp from "./BulletinItem"
import BulletinLightbox from "./BulletinLightbox"
import BulletinToolbar from "./BulletinToolbar"

const CANVAS_W = 1200
const CANVAS_H = 800

type Props = {
  initialItems: Item[]
  mode: "view" | "edit"
}

type DragState = {
  type: "drag" | "resize"
  itemId: string
  startPointerX: number
  startPointerY: number
  startItemX: number
  startItemY: number
  startItemW: number
  startItemH: number
}

export default function BulletinBoard({ initialItems, mode }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const [scale, setScale] = useState(1)
  useEffect(() => {
    function updateScale() {
      if (containerRef.current) {
        setScale(containerRef.current.clientWidth / CANVAS_W)
      }
    }
    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [])

  function handleCanvasClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) setSelectedId(null)
  }

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const currentScale = containerRef.current
      ? containerRef.current.clientWidth / CANVAS_W
      : 1
    const dx = (e.clientX - drag.startPointerX) / currentScale
    const dy = (e.clientY - drag.startPointerY) / currentScale

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== drag.itemId) return item
        if (drag.type === "drag") {
          return { ...item, x: Math.round(drag.startItemX + dx), y: Math.round(drag.startItemY + dy) }
        } else {
          return {
            ...item,
            width: Math.max(80, Math.round(drag.startItemW + dx)),
            height: Math.max(80, Math.round(drag.startItemH + dy)),
          }
        }
      })
    )
  }, [])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
  }, [handlePointerMove])

  function startDrag(e: React.PointerEvent, item: Item, type: "drag" | "resize") {
    e.preventDefault()
    dragRef.current = {
      type,
      itemId: item.id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startItemX: item.x,
      startItemY: item.y,
      startItemW: item.width,
      startItemH: item.height,
    }
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  async function handleUpload(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/bulletin/upload", { method: "POST", body: formData })
    if (!res.ok) {
      const { error } = await res.json()
      alert(error)
      return
    }
    const newItem: Item = await res.json()
    setItems((prev) => [...prev, newItem])
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/bulletin/delete/${id}`, { method: "DELETE" })
    if (!res.ok) return
    setItems((prev) => prev.filter((i) => i.id !== id))
    setSelectedId(null)
  }

  async function handleSave() {
    setSaving(true)
    await fetch("/api/bulletin/layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    })
    setSaving(false)
  }

  return (
    <div className="w-full">
      {mode === "edit" && (
        <BulletinToolbar
          itemCount={items.length}
          saving={saving}
          onUpload={handleUpload}
          onSave={handleSave}
        />
      )}

      {/* Desktop: scaled canvas */}
      <div ref={containerRef} className="hidden md:block w-full" style={{ height: CANVAS_H * scale }}>
        <div
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            position: "relative",
            background: "#c4a06a",
            backgroundImage:
              "repeating-linear-gradient(45deg, #8b6914 0, #8b6914 1px, transparent 0, transparent 50%)",
            backgroundSize: "6px 6px",
          }}
          onClick={handleCanvasClick}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.22,
              backgroundImage:
                "repeating-linear-gradient(45deg, #8b6914 0, #8b6914 1px, transparent 0, transparent 50%)",
              backgroundSize: "6px 6px",
              pointerEvents: "none",
            }}
          />
          {items.map((item) => (
            <BulletinItemComp
              key={item.id}
              item={item}
              mode={mode}
              selected={selectedId === item.id}
              onSelect={() => setSelectedId(item.id)}
              onDelete={() => handleDelete(item.id)}
              onDragStart={(e) => startDrag(e, item, "drag")}
              onResizeStart={(e) => startDrag(e, item, "resize")}
              onViewClick={() => setLightboxUrl(item.image_url)}
            />
          ))}
        </div>
      </div>

      {/* Mobile: 2-column grid */}
      <div
        className="md:hidden w-full p-4"
        style={{
          background: "#c4a06a",
          backgroundImage:
            "repeating-linear-gradient(45deg, #8b6914 0, #8b6914 1px, transparent 0, transparent 50%)",
          backgroundSize: "6px 6px",
          minHeight: 300,
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          {[...items]
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((item) => (
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
                onClick={() => setLightboxUrl(item.image_url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt="Announcement"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
        </div>
      </div>

      {lightboxUrl && (
        <BulletinLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  )
}
