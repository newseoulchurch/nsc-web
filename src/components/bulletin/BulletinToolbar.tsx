"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { BOARD_HEIGHT, IMAGE_LIMIT, NOTE_LIMIT } from "./noteOptions"

type Props = {
  imageCount: number
  noteCount: number
  saving: boolean
  boardHeight: number
  heightMessage: string | null
  onUpload: (file: File) => void
  onAddNote: () => void
  onBoardHeight: (next: number) => void
  onSave: () => void
}

const buttonBase = "px-3 py-1.5 text-xs font-semibold rounded text-white disabled:opacity-40 disabled:cursor-not-allowed"

export default function BulletinToolbar({
  imageCount,
  noteCount,
  saving,
  boardHeight,
  heightMessage,
  onUpload,
  onAddNote,
  onBoardHeight,
  onSave,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const imagesFull = imageCount >= IMAGE_LIMIT
  const notesFull = noteCount >= NOTE_LIMIT

  const [heightDraft, setHeightDraft] = useState(String(boardHeight))
  useLayoutEffect(() => { setHeightDraft(String(boardHeight)) }, [boardHeight])

  function commitDraft() {
    const parsed = Number.parseInt(heightDraft, 10)
    if (Number.isNaN(parsed)) {
      setHeightDraft(String(boardHeight))
      return
    }
    onBoardHeight(parsed)
    setHeightDraft(String(boardHeight))
  }

  function stepHeight(delta: number) {
    const base = Number.parseInt(heightDraft, 10)
    onBoardHeight((Number.isNaN(base) ? boardHeight : base) + delta)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700">
      <span className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
        Bulletin Admin
      </span>
      <span className="text-gray-600 text-xs ml-1">
        images {imageCount}/{IMAGE_LIMIT} · notes {noteCount}/{NOTE_LIMIT}
      </span>

      <div className="flex items-center gap-1 ml-4">
        <span className="text-gray-500 text-[10px] uppercase tracking-widest mr-1">Height</span>
        <button
          type="button"
          aria-label="Decrease board height"
          className="w-6 h-6 rounded bg-gray-800 text-gray-200 text-sm leading-none disabled:opacity-40"
          disabled={boardHeight <= BOARD_HEIGHT.min}
          onClick={() => stepHeight(-BOARD_HEIGHT.step)}
        >
          −
        </button>
        <input
          aria-label="Board height"
          type="number"
          min={BOARD_HEIGHT.min}
          max={BOARD_HEIGHT.max}
          step={BOARD_HEIGHT.step}
          value={heightDraft}
          onChange={(e) => setHeightDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur() }}
          className="w-16 bg-gray-800 text-gray-100 text-xs text-center rounded px-1 py-1 border border-gray-700 focus:outline-none focus:border-gray-500"
        />
        <button
          type="button"
          aria-label="Increase board height"
          className="w-6 h-6 rounded bg-gray-800 text-gray-200 text-sm leading-none disabled:opacity-40"
          disabled={boardHeight >= BOARD_HEIGHT.max}
          onClick={() => stepHeight(BOARD_HEIGHT.step)}
        >
          +
        </button>
        {heightMessage && (
          <span className="text-amber-400 text-[11px] ml-2">{heightMessage}</span>
        )}
      </div>

      <div className="flex-1" />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ""
        }}
      />
      <button
        type="button"
        onClick={() => !imagesFull && inputRef.current?.click()}
        disabled={imagesFull}
        className={`${buttonBase} bg-blue-600 hover:bg-blue-700`}
      >
        {imagesFull ? "Images Full" : "+ Upload Image"}
      </button>
      <button
        type="button"
        onClick={onAddNote}
        disabled={notesFull}
        className={`${buttonBase} bg-yellow-600 hover:bg-yellow-700`}
      >
        {notesFull ? "Notes Full" : "+ Add Note"}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={`${buttonBase} bg-green-600 hover:bg-green-700 disabled:opacity-60`}
      >
        {saving ? "Saving…" : "Save Layout"}
      </button>
    </div>
  )
}
