import { Metadata } from "next";
import YearSection from "@/components/wall-of-faith/YearSection";
import { loadWallOfFaith } from "@/lib/wall-of-faith/load";
import { adminDb } from "@/lib/wall-of-faith/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wall of Faith",
  description: "Every step of NSC's journey — from our first gathering to today.",
};

export default async function WallOfFaithPage() {
  const groups = await loadWallOfFaith(adminDb(), { includeReview: false });

  return (
    <div className="px-4 sm:px-[85px]">
      {/* Header */}
      <section className="mt-[64px] sm:mt-[104px] py-[24px] sm:py-[31px] text-center">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">WALL OF FAITH</h1>
        <p className="mt-4 text-base sm:text-lg text-gray-500">Every step of the journey.</p>
      </section>

      {/* Timeline */}
      <div className="rounded-[18px] px-4 sm:px-12 py-8 mt-8 mb-[64px] sm:mb-[97px]" style={{ background: "#f5ede0" }}>
        {groups.map((g) => (
          <YearSection key={g.year} group={g} />
        ))}
      </div>
    </div>
  );
}
