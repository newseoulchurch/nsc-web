"use client"

import { useEffect, useRef } from "react"
import type { BulletinTextItem } from "@/types/bulletin"
import { NOTE_CONTENT_MAX, NOTE_FONTS } from "./noteOptions"

type Props = {
  item: BulletinTextItem
  editing: boolean
  onChange: (content: string) => void
  onEndEdit: () => void
}

const PADDING = 12

export function noteTextStyle(item: BulletinTextItem): React.CSSProperties {
  return {
    fontFamily: NOTE_FONTS[item.font].css,
    fontSize: item.font_size,
    lineHeight: 1.25,
    color: item.text_color,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  }
}

export default function BulletinNote({ item, editing, onChange, onEndEdit }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editing) return
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [editing])

  const boxStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    padding: PADDING,
    boxSizing: "border-box",
    background: item.note_color,
    overflow: "hidden",
  }

  if (editing) {
    return (
      <div style={boxStyle}>
        <textarea
          ref={textareaRef}
          value={item.content}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onEndEdit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              onEndEdit()
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          spellCheck={false}
          maxLength={NOTE_CONTENT_MAX}
          style={{
            ...noteTextStyle(item),
            width: "100%",
            height: "100%",
            margin: 0,
            padding: 0,
            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",
            overflow: "hidden",
            userSelect: "text",
            cursor: "text",
          }}
        />
      </div>
    )
  }

  return (
    <div style={boxStyle}>
      <div style={noteTextStyle(item)}>{item.content}</div>
    </div>
  )
}
