"use client"

import { useEffect, useRef, useState } from "react"

type OriginRect = { x: number; y: number; width: number; height: number }

type Props = {
  imageUrl: string
  originRect?: OriginRect | null
  onClose: () => void
}

export default function BulletinLightbox({ imageUrl, originRect, onClose }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const panRef = useRef({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ px: number; py: number; panX: number; panY: number } | null>(null)

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { panRef.current = pan }, [pan])

  function getOpenTransform(img: HTMLImageElement, origin: OriginRect) {
    const r = img.getBoundingClientRect()
    const scaleX = origin.width / r.width
    const scaleY = origin.height / r.height
    const dx = (origin.x + origin.width / 2) - (r.x + r.width / 2)
    const dy = (origin.y + origin.height / 2) - (r.y + r.height / 2)
    return `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`
  }

  // Open animation
  useEffect(() => {
    const img = imgRef.current
    const overlay = overlayRef.current
    if (!img || !overlay) return

    function run() {
      const el = imgRef.current
      const ov = overlayRef.current
      if (!el || !ov) return

      if (originRect) {
        el.style.transition = "none"
        el.style.transform = getOpenTransform(el, originRect)
        requestAnimationFrame(() => requestAnimationFrame(() => {
          ov.style.transition = "opacity 0.35s ease"
          ov.style.opacity = "1"
          el.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
          el.style.transform = "none"
        }))
      } else {
        requestAnimationFrame(() => {
          ov.style.transition = "opacity 0.25s ease"
          ov.style.opacity = "1"
        })
      }
    }

    if (img.complete && img.naturalWidth > 0) run()
    else img.addEventListener("load", run, { once: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") animateClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to zoom
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.25 : 0.25
      setZoom(z => {
        const next = Math.min(4, Math.max(1, z + delta))
        if (next === 1) setPan({ x: 0, y: 0 })
        return next
      })
    }
    overlay.addEventListener("wheel", onWheel, { passive: false })
    return () => overlay.removeEventListener("wheel", onWheel)
  }, [])

  function changeZoom(delta: number) {
    setZoom(z => {
      const next = Math.min(4, Math.max(1, z + delta))
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (zoomRef.current <= 1) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStartRef.current = { px: e.clientX, py: e.clientY, panX: panRef.current.x, panY: panRef.current.y }
    setIsDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragStartRef.current) return
    setPan({
      x: dragStartRef.current.panX + (e.clientX - dragStartRef.current.px),
      y: dragStartRef.current.panY + (e.clientY - dragStartRef.current.py),
    })
  }

  function handlePointerUp() {
    dragStartRef.current = null
    setIsDragging(false)
  }

  function animateClose() {
    if (closingRef.current) return
    closingRef.current = true

    const img = imgRef.current
    const overlay = overlayRef.current
    if (!img || !overlay) { onClose(); return }

    overlay.style.transition = "opacity 0.25s ease"
    overlay.style.opacity = "0"

    if (zoomRef.current === 1 && originRect) {
      img.style.transition = "transform 0.25s cubic-bezier(0.4, 0, 1, 1)"
      img.style.transform = getOpenTransform(img, originRect)
    }

    setTimeout(onClose, 260)
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      style={{ opacity: 0 }}
      onClick={animateClose}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white text-lg hover:bg-white/20"
        onClick={animateClose}
      >
        ×
      </button>

      {/* Image + zoom/pan wrapper */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging ? "none" : "transform 0.2s ease",
          transformOrigin: "center",
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Announcement poster"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl"
          draggable={false}
        />
      </div>

      {/* Zoom controls */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 rounded-full px-4 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white disabled:opacity-30 text-xl leading-none"
          onClick={() => changeZoom(-0.5)}
          disabled={zoom <= 1}
        >
          −
        </button>
        <span className="text-white/70 text-xs w-10 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white disabled:opacity-30 text-xl leading-none"
          onClick={() => changeZoom(0.5)}
          disabled={zoom >= 4}
        >
          +
        </button>
      </div>
    </div>
  )
}
