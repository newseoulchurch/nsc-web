import Image from "next/image";
import type { WofEvent } from "@/lib/wall-of-faith/model";

type Props = { event: WofEvent; sizes: string; className?: string; rounded?: "none" | "full" };

// Fills its positioned parent. Without a photo it shows a quiet titled placeholder, never a broken image.
export default function EventPhoto({ event, sizes, className = "", rounded = "none" }: Props) {
  const shape = rounded === "full" ? "rounded-full" : "";
  if (!event.imageUrl) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center overflow-hidden text-center bg-gradient-to-br from-[#d9c9b0] to-[#efe4d3] ${rounded === "full" ? "p-2" : "p-3"} ${shape} ${className}`}>
        {/* keep-all: titles wrap between words (Korean too), never mid-word; overflow is clipped. */}
        <span className={`text-[#8b7355] font-semibold italic leading-snug line-clamp-3 [word-break:keep-all] ${rounded === "full" ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"}`}>{event.title}</span>
      </div>
    );
  }
  return <Image src={event.imageUrl} alt={event.title} fill sizes={sizes} className={`object-cover ${shape} ${className}`} />;
}
