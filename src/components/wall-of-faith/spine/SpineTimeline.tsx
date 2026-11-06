"use client";
import { useState } from "react";
import type { WofYearGroup } from "@/lib/wall-of-faith/model";
import SpineYear from "./SpineYear";

export default function SpineTimeline({ groups }: { groups: WofYearGroup[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));
  return (
    <div className="relative mx-auto max-w-5xl pt-4 pb-[64px] sm:pb-[97px]">
      {/* The spine: through the node centres on phones (left), centred from sm. */}
      <div aria-hidden className="absolute top-0 bottom-0 left-[32px] sm:left-1/2 w-px bg-[#d9c9b0]" />
      {groups.map((g) => (
        <SpineYear key={g.year} group={g} openId={openId} onToggle={toggle} />
      ))}
    </div>
  );
}
