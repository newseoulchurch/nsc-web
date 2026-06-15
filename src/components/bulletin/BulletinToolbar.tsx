"use client"

import { useRef } from "react"

type Props = {
  itemCount: number
  saving: boolean
  onUpload: (file: File) => void
  onSave: () => void
}

export default function BulletinToolbar({ itemCount, saving, onUpload, onSave }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const atLimit = itemCount >= 15

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700">
      <span className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
        Bulletin Admin
      </span>
      <span className="text-gray-600 text-xs ml-1">{itemCount}/15</span>
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
        onClick={() => !atLimit && inputRef.current?.click()}
        disabled={atLimit}
        className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {atLimit ? "Board Full" : "+ Upload Image"}
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-3 py-1.5 text-xs font-semibold rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Layout"}
      </button>
    </div>
  )
}
