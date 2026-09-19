import type { BulletinTextItem, NoteFont } from "@/types/bulletin"

export const NOTE_FONTS: Record<NoteFont, { label: string; css: string }> = {
  circular: { label: "Circular", css: "CircularXX, sans-serif" },
  serif: { label: "Serif", css: "Georgia, 'Times New Roman', serif" },
  hand: { label: "Handwritten", css: "var(--font-hand), cursive" },
  mono: { label: "Mono", css: "ui-monospace, Menlo, Consolas, monospace" },
}

export const NOTE_SIZES = [14, 18, 24, 32, 40, 48, 56, 72] as const

export const TEXT_COLORS = ["#111111", "#ffffff", "#8b1a1a", "#1a3a8b", "#1f5e2e", "#6b6b6b"] as const

export const NOTE_COLORS = ["#fff59d", "#f8bbd0", "#bbdefb", "#c8e6c9", "#ffcc80", "#ffffff"] as const

export const NOTE_DEFAULTS: Pick<
  BulletinTextItem,
  "font" | "font_size" | "text_color" | "note_color" | "width" | "height"
> = {
  font: "circular",
  font_size: 24,
  text_color: "#111111",
  note_color: "#fff59d",
  width: 260,
  height: 120,
}

export const IMAGE_LIMIT = 15
export const NOTE_LIMIT = 10
export const NOTE_CONTENT_MAX = 500

export const CANVAS_W = 1200

export const BOARD_HEIGHT = {
  min: 400,
  max: 3000,
  step: 100,
  default: 800,
  itemMargin: 40,
} as const

export const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i
