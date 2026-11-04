import { Metadata } from "next";
import { wallOfFaithEvents, yearThemes, WallOfFaithEvent } from "@/data/wall-of-faith";
import YearSection from "@/components/wall-of-faith/YearSection";

export const metadata: Metadata = {
  title: "Wall of Faith",
  description: "Every step of NSC's journey — from our first gathering to today.",
};

function groupByYear(events: WallOfFaithEvent[]): Map<number, WallOfFaithEvent[]> {
  const map = new Map<number, WallOfFaithEvent[]>();
  for (const event of events) {
    const group = map.get(event.year) ?? [];
    group.push(event);
    map.set(event.year, group);
  }
  return map;
}

export default function WallOfFaithPage() {
  const grouped = groupByYear(wallOfFaithEvents);
  const years = Array.from(grouped.keys()).sort((a, b) => a - b);

  return (
    <div className="px-4 sm:px-[85px]">
      {/* Header */}
      <section className="mt-[64px] sm:mt-[104px] py-[24px] sm:py-[31px] text-center">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
          WALL OF FAITH
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-500">
          Every step of the journey.
        </p>
      </section>

      {/* Timeline */}
      <div
        className="rounded-[18px] px-4 sm:px-12 py-8 mt-8 mb-[64px] sm:mb-[97px]"
        style={{ background: "#f5ede0" }}
      >
        {years.map((year) => (
          <YearSection
            key={year}
            year={year}
            theme={yearThemes[year]}
            events={grouped.get(year)!}
          />
        ))}
      </div>
    </div>
  );
}
