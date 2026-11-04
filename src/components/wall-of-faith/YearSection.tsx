import { WallOfFaithEvent } from "@/data/wall-of-faith";
import PolaroidCard from "./PolaroidCard";

interface YearSectionProps {
  year: number;
  theme?: string;
  events: WallOfFaithEvent[];
}

export default function YearSection({ year, theme, events }: YearSectionProps) {
  return (
    <section className="mb-20">
      {/* Year heading */}
      <div className="flex flex-col items-center my-12 gap-2">
        <div className="relative flex items-center justify-center w-full">
          <div className="absolute inset-x-0 h-px bg-[#d9c9b0]" />
          <span className="relative bg-[#f5ede0] px-6 text-4xl font-black italic tracking-[8px] text-[#8b7355] opacity-60 select-none">
            {year}
          </span>
        </div>
        {theme && (
          <p className="text-sm uppercase tracking-[3px] text-[#a0896a] font-semibold text-center">
            {theme}
          </p>
        )}
      </div>

      {/* Events */}
      <div className="flex flex-col gap-16">
        {events.map((event, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={event.id}
              className={`flex flex-col sm:flex-row items-center gap-8 sm:gap-12 ${
                isLeft ? "sm:flex-row" : "sm:flex-row-reverse"
              }`}
            >
              {/* Polaroid */}
              <div className="flex justify-center">
                <PolaroidCard event={event} index={i} />
              </div>

              {/* Text */}
              <div
                className={`flex-1 ${
                  isLeft ? "text-left" : "sm:text-right text-left"
                }`}
              >
                <p className="text-sm text-[#a0896a] uppercase tracking-widest mb-2">
                  {event.date}
                </p>
                <h3 className="text-2xl font-black text-[#3d2f1e] mb-3 leading-tight">
                  {event.title}
                </h3>
                <p className="text-base text-[#6b5540] leading-relaxed">
                  {event.description}
                </p>
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
