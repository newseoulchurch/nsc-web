"use client"

import type { BulletinTextItem, NoteFont } from "@/types/bulletin"
import { NOTE_COLORS, NOTE_FONTS, NOTE_SIZES, TEXT_COLORS } from "./noteOptions"

type Props = {
  item: BulletinTextItem
  onChange: (patch: Partial<BulletinTextItem>) => void
}

const selectClass =
  "bg-gray-800 text-gray-100 text-xs rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-gray-500"

function Swatches({
  label,
  colors,
  value,
  onPick,
}: {
  label: string
  colors: readonly string[]
  value: string
  onPick: (color: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-500 text-[10px] uppercase tracking-widest mr-1">{label}</span>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`${label} ${color}`}
          onClick={() => onPick(color)}
          className="w-5 h-5 rounded-sm border"
          style={{
            background: color,
            borderColor: value === color ? "#fff" : "#4b5563",
            boxShadow: value === color ? "0 0 0 2px #2563eb" : "none",
          }}
        />
      ))}
    </div>
  )
}

export default function BulletinFormatBar({ item, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-gray-900 border-b border-gray-700">
      <select
        aria-label="Font"
        className={selectClass}
        value={item.font}
        onChange={(e) => onChange({ font: e.target.value as NoteFont })}
      >
        {(Object.keys(NOTE_FONTS) as NoteFont[]).map((key) => (
          <option key={key} value={key}>{NOTE_FONTS[key].label}</option>
        ))}
      </select>

      <select
        aria-label="Font size"
        className={selectClass}
        value={item.font_size}
        onChange={(e) => onChange({ font_size: Number(e.target.value) })}
      >
        {NOTE_SIZES.map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>

      <Swatches label="Text" colors={TEXT_COLORS} value={item.text_color} onPick={(c) => onChange({ text_color: c })} />
      <Swatches label="Note" colors={NOTE_COLORS} value={item.note_color} onPick={(c) => onChange({ note_color: c })} />
    </div>
  )
}
