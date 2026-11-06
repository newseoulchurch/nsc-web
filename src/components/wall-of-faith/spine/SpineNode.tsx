import type { WofEvent } from "@/lib/wall-of-faith/model";
import EventPhoto from "../EventPhoto";
import MilestoneBadge from "../MilestoneBadge";
import SpineDetail from "./SpineDetail";

type Props = { event: WofEvent; side: "left" | "right"; open: boolean; onToggle: () => void };

export default function SpineNode({ event, side, open, onToggle }: Props) {
  const heading = (
    <div className={`min-w-0 [overflow-wrap:anywhere] ${side === "left" ? "sm:text-right" : "sm:text-left"}`}>
      <p className="text-[11px] uppercase tracking-[1.5px] text-[#a0896a]">{event.dateLabel}</p>
      {event.milestone && (
        <div className="my-1">
          <MilestoneBadge text={event.milestone} />
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-bold text-[#3d2f1e] leading-tight">{event.title}</h3>
    </div>
  );
  const body = <p className="min-w-0 [overflow-wrap:anywhere] text-sm text-[#6b5540] leading-relaxed">{event.description}</p>;

  return (
    <div>
      {/* Phones: node at left, heading and description to its right.
          sm+: heading | node | description, sides alternating per event. */}
      <div className="grid grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_104px_minmax(0,1fr)] items-center gap-x-4 sm:gap-x-8">
        <div className={`hidden sm:block ${side === "left" ? "sm:order-1" : "sm:order-3"}`}>{heading}</div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`${event.title}: ${open ? "close" : "open"} details`}
          className="relative z-10 sm:order-2 h-16 w-16 sm:h-[104px] sm:w-[104px] rounded-full border-2 border-[#d9c9b0] bg-white p-1 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b7355]"
        >
          <span className="relative block h-full w-full overflow-hidden rounded-full">
            <EventPhoto event={event} rounded="full" sizes="104px" />
          </span>
        </button>
        <div className={`hidden sm:block ${side === "left" ? "sm:order-3" : "sm:order-1"}`}>{body}</div>
        <div className="sm:hidden min-w-0 space-y-1">
          {heading}
          {body}
        </div>
      </div>
      {open && <SpineDetail event={event} />}
    </div>
  );
}
