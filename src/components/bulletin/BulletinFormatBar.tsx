"use client"

import type { BulletinTextItem, NoteAlign, NoteFont } from "@/types/bulletin"
import { NOTE_ALIGNS, NOTE_COLORS, NOTE_FONTS, NOTE_SIZES, TEXT_COLORS } from "./noteOptions"

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

const ALIGN_ICON_BAR_WIDTHS: readonly number[] = [12, 8, 12, 6]

function AlignIcon({ align }: { align: NoteAlign }) {
  const x = (w: number): number => (align === "left" ? 1 : align === "center" ? (14 - w) / 2 : 13 - w)
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
      {ALIGN_ICON_BAR_WIDTHS.map((w, i) => (
        <rect key={i} x={x(w)} y={i * 3 + 0.5} width={w} height={1.5} rx={0.5} fill="currentColor" />
      ))}
    </svg>
  )
}

function AlignButtons({ value, onPick }: { value: NoteAlign; onPick: (align: NoteAlign) => void }) {
  return (
    <div className="flex items-center rounded border border-gray-700 overflow-hidden" role="group" aria-label="Text alignment">
      {NOTE_ALIGNS.map(({ value: align, label }) => (
        <button
          key={align}
          type="button"
          aria-label={label}
          aria-pressed={value === align}
          onClick={() => onPick(align)}
          className={`px-2 py-1.5 ${value === align ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <AlignIcon align={align} />
        </button>
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

      <AlignButtons value={item.text_align} onPick={(text_align) => onChange({ text_align })} />

      <Swatches label="Text" colors={TEXT_COLORS} value={item.text_color} onPick={(c) => onChange({ text_color: c })} />
      <Swatches label="Note" colors={NOTE_COLORS} value={item.note_color} onPick={(c) => onChange({ note_color: c })} />
    </div>
  )
}
