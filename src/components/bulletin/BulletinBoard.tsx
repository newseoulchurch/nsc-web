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
  type: "drag" | "resize" | "resize-h" | "resize-v" | "rotate"
  itemId: string
  startPointerX: number
  startPointerY: number
  startItemX: number
  startItemY: number
  startItemW: number
  startItemH: number
  aspectRatio?: number
  centerViewportX?: number
  centerViewportY?: number
  startRotation?: number
}

export default function BulletinBoard({ initialItems, mode }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lightboxOrigin, setLightboxOrigin] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
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
        }
        if (drag.type === "resize") {
          const newW = Math.max(80, Math.round(drag.startItemW + dx))
          const newH = Math.max(80, Math.round(newW / drag.aspectRatio!))
          return { ...item, width: newW, height: newH }
        }
        if (drag.type === "resize-h") {
          return { ...item, width: Math.max(80, Math.round(drag.startItemW + dx)) }
        }
        if (drag.type === "resize-v") {
          return { ...item, height: Math.max(80, Math.round(drag.startItemH + dy)) }
        }
        if (drag.type === "rotate") {
          const cx = drag.centerViewportX!
          const cy = drag.centerViewportY!
          const startAngle = Math.atan2(drag.startPointerY - cy, drag.startPointerX - cx)
          const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx)
          const delta = (currentAngle - startAngle) * (180 / Math.PI)
          return { ...item, rotation: Math.round(drag.startRotation! + delta) }
        }
        return item
      })
    )
  }, [])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
  }, [handlePointerMove])

  function startDrag(e: React.PointerEvent, item: Item, type: DragState["type"]) {
    e.preventDefault()
    const container = containerRef.current
    const currentScale = container ? container.clientWidth / CANVAS_W : 1
    const canvasRect = container?.getBoundingClientRect()
    dragRef.current = {
      type,
      itemId: item.id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startItemX: item.x,
      startItemY: item.y,
      startItemW: item.width,
      startItemH: item.height,
      ...(type === "resize" && { aspectRatio: item.width / item.height }),
      ...(type === "rotate" && canvasRect && {
        centerViewportX: canvasRect.left + (item.x + item.width / 2) * currentScale,
        centerViewportY: canvasRect.top + (item.y + item.height / 2) * currentScale,
        startRotation: item.rotation,
      }),
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
    const res = await fetch("/api/bulletin/layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Save failed" }))
      alert(error ?? "Save failed")
    }
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

      {/* Desktop: framed canvas */}
      <div
        className="hidden md:block"
        style={{
          padding: 16,
          background: `
  repeating-linear-gradient(
    89deg,
    transparent 0px, transparent 3px,
    rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px
  ),
  repeating-linear-gradient(
    91deg,
    transparent 0px, transparent 7px,
    rgba(255,255,255,0.03) 7px, rgba(255,255,255,0.03) 8px
  ),
  linear-gradient(160deg, #6b4423 0%, #4a2f15 50%, #3a2310 100%)
`.replace(/\s+/g, " ").trim(),
          boxShadow: "0 20px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
      <div ref={containerRef} className="w-full" style={{ height: CANVAS_H * scale }}>
        <div
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            position: "relative",
            background: "#181818",
            backgroundImage: "radial-gradient(circle, #252525 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          onClick={handleCanvasClick}
        >
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
              onResizeHStart={(e) => startDrag(e, item, "resize-h")}
              onResizeVStart={(e) => startDrag(e, item, "resize-v")}
              onRotateStart={(e) => startDrag(e, item, "rotate")}
              onViewClick={(rect) => { setLightboxUrl(item.image_url); setLightboxOrigin(rect) }}
            />
          ))}
        </div>
      </div>
      </div>

      {/* Mobile: framed grid */}
      <div
        className="md:hidden"
        style={{
          padding: 8,
          background: `
  repeating-linear-gradient(
    89deg,
    transparent 0px, transparent 3px,
    rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px
  ),
  repeating-linear-gradient(
    91deg,
    transparent 0px, transparent 7px,
    rgba(255,255,255,0.03) 7px, rgba(255,255,255,0.03) 8px
  ),
  linear-gradient(160deg, #6b4423 0%, #4a2f15 50%, #3a2310 100%)
`.replace(/\s+/g, " ").trim(),
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        }}
      >
      <div
        className="w-full p-4"
        style={{
          background: "#181818",
          backgroundImage: "radial-gradient(circle, #252525 1px, transparent 1px)",
          backgroundSize: "20px 20px",
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
                onClick={mode === "view" ? () => setLightboxUrl(item.image_url) : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt="Announcement"
                  style={{ width: "100%", height: "100%", objectFit: "fill", display: "block" }}
                />
              </div>
            ))}
        </div>
      </div>
      </div>

      {lightboxUrl && (
        <BulletinLightbox
          imageUrl={lightboxUrl}
          originRect={lightboxOrigin}
          onClose={() => { setLightboxUrl(null); setLightboxOrigin(null) }}
        />
      )}
    </div>
  )
}
