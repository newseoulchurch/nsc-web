export type NoteFont = "circular" | "serif" | "hand" | "mono"

export type BulletinItemBase = {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  z_index: number
  created_at: string
}

export type BulletinImageItem = BulletinItemBase & {
  type: "image"
  image_url: string
}

export type BulletinTextItem = BulletinItemBase & {
  type: "text"
  content: string
  font: NoteFont
  font_size: number
  text_color: string
  note_color: string
}

export type BulletinItem = BulletinImageItem | BulletinTextItem

export type BulletinSettings = {
  board_height: number
}

const NOTE_FONT_VALUES: readonly NoteFont[] = ["circular", "serif", "hand", "mono"]

export function isNoteFont(value: unknown): value is NoteFont {
  return typeof value === "string" && (NOTE_FONT_VALUES as readonly string[]).includes(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function parseBase(row: Record<string, unknown>): BulletinItemBase | null {
  const { id, x, y, width, height, rotation, z_index, created_at } = row
  if (typeof id !== "string" || typeof created_at !== "string") return null
  if (![x, y, width, height, rotation, z_index].every(isFiniteNumber)) return null
  return {
    id,
    x: x as number,
    y: y as number,
    width: width as number,
    height: height as number,
    rotation: rotation as number,
    z_index: z_index as number,
    created_at,
  }
}

export function parseBulletinItem(row: Record<string, unknown>): BulletinItem | null {
  const base = parseBase(row)
  if (!base) return null

  const type = row.type ?? "image"

  if (type === "image") {
    if (typeof row.image_url !== "string" || row.image_url.length === 0) return null
    return { ...base, type: "image", image_url: row.image_url }
  }

  if (type === "text") {
    const { content, font, font_size, text_color, note_color } = row
    if (typeof content !== "string") return null
    if (!isNoteFont(font)) return null
    if (!isFiniteNumber(font_size)) return null
    if (typeof text_color !== "string" || typeof note_color !== "string") return null
    return { ...base, type: "text", content, font, font_size, text_color, note_color }
  }

  return null
}
