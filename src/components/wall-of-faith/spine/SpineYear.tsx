import type { WofYearGroup } from "@/lib/wall-of-faith/model";
import SpineNode from "./SpineNode";

type Props = { group: WofYearGroup; openId: string | null; onToggle: (id: string) => void };

export default function SpineYear({ group, openId, onToggle }: Props) {
  return (
    <section className="relative">
      <div className="relative flex sm:justify-center py-10">
        <div className="relative z-10 rounded-full border-2 border-[#d9c9b0] bg-white px-6 sm:px-10 py-3 text-center max-w-[18rem]">
          <p className="text-2xl sm:text-3xl font-black italic tracking-[6px] text-[#8b7355]">{group.year}</p>
          {group.theme && (
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[2.5px] text-[#a0896a] leading-snug">{group.theme}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-8 sm:gap-10">
        {group.events.map((e, i) => (
          <SpineNode
            key={e.id}
            event={e}
            side={i % 2 === 0 ? "left" : "right"}
            open={openId === e.id}
            onToggle={() => onToggle(e.id)}
          />
        ))}
      </div>
    </section>
  );
}
