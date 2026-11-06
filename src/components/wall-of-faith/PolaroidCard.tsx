"use client";

import { useState } from "react";
import type { WofEvent } from "@/lib/wall-of-faith/model";
import EventPhoto from "./EventPhoto";

interface PolaroidCardProps {
  event: WofEvent;
  index: number;
}

export default function PolaroidCard({ event, index }: PolaroidCardProps) {
  const [flipped, setFlipped] = useState(false);
  const rotation = index % 2 === 0 ? "-2deg" : "1.8deg";

  return (
    <div
      className="cursor-pointer select-none w-[220px] sm:w-[260px] flex-shrink-0"
      style={{ perspective: "600px" }}
      onClick={() => setFlipped((f) => !f)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.5s ease",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1.2",
        }}
      >
        {/* Front */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            background: "white",
            padding: "8px 8px 32px",
            boxShadow: "2px 4px 16px rgba(0,0,0,0.15)",
            transform: `rotate(${rotation})`,
            overflow: "hidden",
            overflowWrap: "anywhere",
          }}
        >
          <div style={{ position: "relative", width: "100%", aspectRatio: "1", overflow: "hidden" }}>
            <EventPhoto event={event} sizes="(max-width: 640px) 220px, 260px" />
          </div>
          <p
            style={{
              textAlign: "center",
              marginTop: "10px",
              fontSize: "13px",
              color: "#8b7355",
              fontStyle: "italic",
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {event.title}
          </p>
        </div>

        {/* Back */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            background: "#fffaf4",
            padding: "16px 14px",
            boxShadow: "2px 4px 16px rgba(0,0,0,0.15)",
            transform: `rotateY(180deg) rotate(${rotation})`,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            overflow: "hidden",
            overflowWrap: "anywhere",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "#a0896a",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              flexShrink: 0,
            }}
          >
            {event.dateLabel}
          </p>
          {event.milestone && (
            <p style={{ fontSize: "10px", color: "#8b7355", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", flexShrink: 0 }}>
              ✦ {event.milestone}
            </p>
          )}
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "#3d2f1e",
              lineHeight: 1.2,
              flexShrink: 0,
            }}
          >
            {event.title}
          </h3>
          <p
            style={{
              fontSize: "12px",
              color: "#6b5540",
              lineHeight: 1.55,
              flex: 1,
              overflow: "hidden",
            }}
          >
            {event.description}
          </p>
          {event.youtubeUrl && (
            <a
              href={event.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: "12px",
                color: "#cc0000",
                fontWeight: 700,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              ▶ Watch on YouTube
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
