"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { BulletinImageItem, BulletinItem as Item, BulletinTextItem, Mode } from "@/types/bulletin"
import BulletinItemFrame from "./BulletinItemFrame"
import BulletinImage from "./BulletinImage"
import BulletinNote from "./BulletinNote"
import BulletinMobileList from "./BulletinMobileList"
import BulletinLightbox from "./BulletinLightbox"
import BulletinToolbar from "./BulletinToolbar"
import BulletinFormatBar from "./BulletinFormatBar"
import { handFont } from "./handFont"
import { BOARD_HEIGHT, CANVAS_W, NOTE_DEFAULTS, NOTE_LIMIT } from "./noteOptions"

type Props = {
  initialItems: Item[]
  initialBoardHeight: number
  mode: Mode
}

type DragState = {
  type: "drag" | "resize" | "resize-free" | "resize-h" | "resize-v" | "rotate"
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

const MIN_ITEM_SIZE = 80

const frameBackground = `
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
`.replace(/\s+/g, " ").trim()

const corkboardStyle: React.CSSProperties = {
  background: "#181818",
  backgroundImage: "radial-gradient(circle, #252525 1px, transparent 1px)",
  backgroundSize: "20px 20px",
}

function isVisible(item: Item, mode: Mode): boolean {
  if (mode === "edit") return true
  return item.type === "image" || item.content.trim().length > 0
}

function clampBoardHeight(requested: number, items: Item[]): { value: number; message: string | null } {
  const bounded = Math.min(BOARD_HEIGHT.max, Math.max(BOARD_HEIGHT.min, Math.round(requested)))
  const lowest = items.reduce((max, item) => Math.max(max, item.y + item.height), 0)
  const floor = lowest + BOARD_HEIGHT.itemMargin
  if (bounded < floor) {
    return {
      value: Math.min(BOARD_HEIGHT.max, floor),
      message: "Move or shrink the lowest item to go shorter.",
    }
  }
  return { value: bounded, message: null }
}

function centeredNoteY(container: HTMLDivElement | null, scale: number, boardHeight: number): number {
  if (!container) {
    return Math.round((boardHeight - NOTE_DEFAULTS.height) / 2)
  }
  const rect = container.getBoundingClientRect()
  const top = Math.max(0, -rect.top) / scale
  const bottom = Math.min(rect.height, window.innerHeight - rect.top) / scale
  const centered = (top + bottom) / 2 - NOTE_DEFAULTS.height / 2
  return Math.round(Math.min(boardHeight - NOTE_DEFAULTS.height, Math.max(0, centered)))
}

export default function BulletinBoard({ initialItems, initialBoardHeight, mode }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [boardHeight, setBoardHeight] = useState(initialBoardHeight)
  const [heightMessage, setHeightMessage] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
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

  const selectedItem = items.find((i) => i.id === selectedId) ?? null
  const selectedNote = selectedItem?.type === "text" ? selectedItem : null
  const imageCount = items.filter((i) => i.type === "image").length
  const noteCount = items.filter((i) => i.type === "text").length

  function select(id: string) {
    if (id !== selectedId) setEditingId(null)
    setSelectedId(id)
  }

  function handleCanvasClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      setSelectedId(null)
      setEditingId(null)
    }
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
          const newW = Math.max(MIN_ITEM_SIZE, Math.round(drag.startItemW + dx))
          const newH = Math.max(MIN_ITEM_SIZE, Math.round(newW / drag.aspectRatio!))
          return { ...item, width: newW, height: newH }
        }
        if (drag.type === "resize-free") {
          return {
            ...item,
            width: Math.max(MIN_ITEM_SIZE, Math.round(drag.startItemW + dx)),
            height: Math.max(MIN_ITEM_SIZE, Math.round(drag.startItemH + dy)),
          }
        }
        if (drag.type === "resize-h") {
          return { ...item, width: Math.max(MIN_ITEM_SIZE, Math.round(drag.startItemW + dx)) }
        }
        if (drag.type === "resize-v") {
          return { ...item, height: Math.max(MIN_ITEM_SIZE, Math.round(drag.startItemH + dy)) }
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
    if (editingId === item.id) return
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
    const row = await res.json()
    const newItem: BulletinImageItem = { ...row, type: "image" }

    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX_W = 260, MAX_H = 340
      const ratio = img.naturalWidth / img.naturalHeight
      let w = MAX_W
      let h = Math.round(w / ratio)
      if (h > MAX_H) { h = MAX_H; w = Math.round(h * ratio) }
      setItems((prev) => [...prev, { ...newItem, width: w, height: h }])
    }
    img.onerror = () => { URL.revokeObjectURL(url); setItems((prev) => [...prev, newItem]) }
    img.src = url
  }

  function handleAddNote() {
    if (noteCount >= NOTE_LIMIT) return
    const maxZ = items.reduce((max, item) => Math.max(max, item.z_index), 0)
    const note: BulletinTextItem = {
      id: crypto.randomUUID(),
      type: "text",
      content: "",
      font: NOTE_DEFAULTS.font,
      font_size: NOTE_DEFAULTS.font_size,
      text_color: NOTE_DEFAULTS.text_color,
      note_color: NOTE_DEFAULTS.note_color,
      width: NOTE_DEFAULTS.width,
      height: NOTE_DEFAULTS.height,
      x: Math.round((CANVAS_W - NOTE_DEFAULTS.width) / 2),
      y: centeredNoteY(containerRef.current, scale, boardHeight),
      rotation: 0,
      z_index: maxZ + 1,
      created_at: new Date().toISOString(),
    }
    setItems((prev) => [...prev, note])
    setSelectedId(note.id)
    setEditingId(note.id)
  }

  function handleNoteChange(id: string, patch: Partial<BulletinTextItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id && item.type === "text" ? { ...item, ...patch } : item))
    )
  }

  async function handleDelete(item: Item) {
    if (item.type === "image") {
      const res = await fetch(`/api/bulletin/delete/${item.id}`, { method: "DELETE" })
      if (!res.ok) return
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setSelectedId(null)
    setEditingId(null)
  }

  function handleBoardHeight(requested: number) {
    const { value, message } = clampBoardHeight(requested, items)
    setBoardHeight(value)
    setHeightMessage(message)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch("/api/bulletin/layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, board_height: boardHeight }),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Save failed" }))
      alert(error ?? "Save failed")
    }
  }

  const visibleItems = items.filter((item) => isVisible(item, mode))

  return (
    <div className={`w-full ${handFont.variable}`}>
      {mode === "edit" && (
        <>
          <BulletinToolbar
            imageCount={imageCount}
            noteCount={noteCount}
            saving={saving}
            boardHeight={boardHeight}
            heightMessage={heightMessage}
            onUpload={handleUpload}
            onAddNote={handleAddNote}
            onBoardHeight={handleBoardHeight}
            onSave={handleSave}
          />
          {selectedNote && (
            <BulletinFormatBar
              item={selectedNote}
              onChange={(patch) => handleNoteChange(selectedNote.id, patch)}
            />
          )}
        </>
      )}

      {/* Desktop: framed canvas */}
      <div
        className="hidden md:block"
        style={{
          padding: 16,
          background: frameBackground,
          boxShadow: "0 20px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div ref={containerRef} className="w-full" style={{ height: boardHeight * scale }}>
          <div
            style={{
              ...corkboardStyle,
              width: CANVAS_W,
              height: boardHeight,
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              position: "relative",
            }}
            onClick={handleCanvasClick}
          >
            {visibleItems.map((item) => (
              <BulletinItemFrame
                key={item.id}
                item={item}
                mode={mode}
                selected={selectedId === item.id}
                lockAspect={item.type === "image"}
                onSelect={() => select(item.id)}
                onDelete={() => handleDelete(item)}
                onDragStart={(e) => startDrag(e, item, "drag")}
                onCornerStart={(e) => startDrag(e, item, item.type === "image" ? "resize" : "resize-free")}
                onResizeHStart={(e) => startDrag(e, item, "resize-h")}
                onResizeVStart={(e) => startDrag(e, item, "resize-v")}
                onRotateStart={(e) => startDrag(e, item, "rotate")}
                onDoubleClick={item.type === "text" ? () => setEditingId(item.id) : undefined}
                onViewClick={
                  item.type === "image"
                    ? (rect) => { setLightboxUrl(item.image_url); setLightboxOrigin(rect) }
                    : undefined
                }
              >
                {item.type === "image" ? (
                  <BulletinImage item={item} />
                ) : (
                  <BulletinNote
                    item={item}
                    editing={editingId === item.id}
                    onChange={(content) => handleNoteChange(item.id, { content })}
                    onEndEdit={() => setEditingId(null)}
                  />
                )}
              </BulletinItemFrame>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: reading-order list */}
      <div
        className="md:hidden"
        style={{
          padding: 8,
          background: frameBackground,
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div className="w-full p-4 flex flex-col gap-4" style={{ ...corkboardStyle, minHeight: 300 }}>
          <BulletinMobileList items={visibleItems} mode={mode} onOpenImage={setLightboxUrl} />
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
