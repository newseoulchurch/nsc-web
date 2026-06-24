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
  onResizeHStart?: (e: React.PointerEvent) => void
  onResizeVStart?: (e: React.PointerEvent) => void
  onRotateStart?: (e: React.PointerEvent) => void
  onViewClick?: (rect: { x: number; y: number; width: number; height: number }) => void
}

export default function BulletinItem({
  item,
  mode,
  selected = false,
  onSelect,
  onDelete,
  onDragStart,
  onResizeStart,
  onResizeHStart,
  onResizeVStart,
  onRotateStart,
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
      ? "0 0 0 1px #fff, 0 0 0 2.5px rgba(0,0,0,0.3), 4px 6px 16px rgba(0,0,0,0.45)"
      : "4px 6px 16px rgba(0,0,0,0.45)",
    borderRadius: 2,
    cursor: mode === "edit" ? "grab" : "pointer",
    userSelect: "none",
    touchAction: "none",
  }

  const dot = (extra: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
    zIndex: 10,
    ...extra,
  })

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
      onClick={mode === "view" ? (e) => {
        const r = e.currentTarget.getBoundingClientRect()
        onViewClick?.({ x: r.x, y: r.y, width: r.width, height: r.height })
      } : undefined}
    >
      <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 2 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt="Announcement"
          style={{ width: "100%", height: "100%", objectFit: "fill", display: "block" }}
          draggable={false}
        />
      </div>

      {/* Push pin — view mode only (edit mode uses the rotate handle in the same spot) */}
      {mode === "view" && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "radial-gradient(circle at 38% 35%, #e8e8e8, #888 55%, #555)",
            boxShadow: "0 2px 5px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.25)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      )}

      {mode === "edit" && selected && (
        <>
          {/* Delete */}
          <button
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              color: "#111",
              border: "none",
              fontSize: 13,
              lineHeight: 1,
              paddingTop: 2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
              transform: `rotate(${-item.rotation}deg)`,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete?.() }}
          >
            ×
          </button>

          {/* Rotate handle */}
          <div
            style={dot({ top: -28, left: "50%", transform: "translateX(-50%)", cursor: "grab" })}
            onPointerDown={(e) => { e.stopPropagation(); onRotateStart?.(e) }}
          />

          {/* Right-edge resize (width only) */}
          <div
            style={dot({ right: -6, top: "50%", transform: "translateY(-50%)", cursor: "e-resize" })}
            onPointerDown={(e) => { e.stopPropagation(); onResizeHStart?.(e) }}
          />

          {/* Bottom-edge resize (height only) */}
          <div
            style={dot({ bottom: -6, left: "50%", transform: "translateX(-50%)", cursor: "s-resize" })}
            onPointerDown={(e) => { e.stopPropagation(); onResizeVStart?.(e) }}
          />

          {/* Corner resize (aspect-ratio locked) */}
          <div
            style={dot({ bottom: -6, right: -6, cursor: "se-resize" })}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart?.(e) }}
          />
        </>
      )}
    </div>
  )
}
