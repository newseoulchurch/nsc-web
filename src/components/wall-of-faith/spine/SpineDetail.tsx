import type { WofEvent } from "@/lib/wall-of-faith/model";
import EventPhoto from "../EventPhoto";
import MilestoneBadge from "../MilestoneBadge";

export default function SpineDetail({ event }: { event: WofEvent }) {
  return (
    <div className="relative z-10 mt-4 ml-[80px] sm:mx-auto sm:max-w-[520px] rounded-2xl border border-[#e8dccb] bg-[#fffaf4] p-4 sm:p-6 [overflow-wrap:anywhere]">
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl">
        <EventPhoto event={event} sizes="(max-width: 640px) 90vw, 520px" />
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-[1.5px] text-[#a0896a]">{event.dateLabel}</p>
      {event.milestone && (
        <div className="mt-2">
          <MilestoneBadge text={event.milestone} />
        </div>
      )}
      <h3 className="mt-1 text-xl font-bold text-[#3d2f1e]">{event.title}</h3>
      <p className="mt-2 text-sm text-[#6b5540] leading-relaxed">{event.description}</p>
      {event.significance && <p className="mt-3 text-sm italic text-[#8b7355] leading-relaxed">{event.significance}</p>}
      {event.youtubeUrl && (
        <a
          href={event.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm font-bold text-[#cc0000] hover:underline"
        >
          ▶ Watch on YouTube
        </a>
      )}
    </div>
  );
}
