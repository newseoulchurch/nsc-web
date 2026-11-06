import Image from "next/image";
import type { WofEvent } from "@/lib/wall-of-faith/model";

type Props = { event: WofEvent; sizes: string; className?: string; rounded?: "none" | "full" };

// Fills its positioned parent. Without a photo it shows a quiet titled placeholder, never a broken image.
export default function EventPhoto({ event, sizes, className = "", rounded = "none" }: Props) {
  const shape = rounded === "full" ? "rounded-full" : "";
  if (!event.imageUrl) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center p-3 text-center bg-gradient-to-br from-[#d9c9b0] to-[#efe4d3] ${shape} ${className}`}>
        <span className="text-[#8b7355] text-xs sm:text-sm font-semibold italic leading-snug line-clamp-3 break-words">{event.title}</span>
      </div>
    );
  }
  return <Image src={event.imageUrl} alt={event.title} fill sizes={sizes} className={`object-cover ${shape} ${className}`} />;
}
