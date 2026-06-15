"use client"

import type { BulletinItem as Item } from "@/types/bulletin"

type Props = {
  item: Item
  mode: "view" | "edit"
  selected?: boolean
  onSelect?: () => void
  onDelete?: () => void
  onDragStart?: (e: React.PointerEvent) => void
  onResizeStart?: (e: React.PointerEvent) => void
  onViewClick?: () => void
}

export default function BulletinItem({
  item,
  mode,
  selected = false,
  onSelect,
  onDelete,
  onDragStart,
  onResizeStart,
  onViewClick,
}: Props) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    transform: `rotate(${item.rotation}deg)`,
    boxShadow: selected
      ? "0 0 0 2px #3182ce, 4px 6px 16px rgba(0,0,0,0.45)"
      : "4px 6px 16px rgba(0,0,0,0.45)",
    borderRadius: 2,
    overflow: "hidden",
    cursor: mode === "edit" ? "grab" : "pointer",
    userSelect: "none",
    touchAction: "none",
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (mode === "edit") {
      onSelect?.()
      onDragStart?.(e)
    }
  }

  return (
    <div
      style={style}
      onPointerDown={handlePointerDown}
      onClick={mode === "view" ? onViewClick : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt="Announcement"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        draggable={false}
      />

      {mode === "edit" && selected && (
        <>
          <button
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#e53e3e",
              color: "white",
              border: "none",
              fontSize: 14,
              lineHeight: 1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.()
            }}
          >
            ×
          </button>

          <div
            style={{
              position: "absolute",
              bottom: -6,
              right: -6,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#3182ce",
              cursor: "se-resize",
              zIndex: 10,
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              onResizeStart?.(e)
            }}
          />
        </>
      )}
    </div>
  )
}
