import { Metadata } from "next";
import SpineTimeline from "@/components/wall-of-faith/spine/SpineTimeline";
import { loadWallOfFaith } from "@/lib/wall-of-faith/load";
import { adminDb } from "@/lib/wall-of-faith/server";

export const dynamic = "force-dynamic";

// Design option B for staff comparison; not linked from the nav and not indexed.
export const metadata: Metadata = { title: "Wall of Faith", robots: { index: false } };

export default async function WallOfFaithSpinePage() {
  const groups = await loadWallOfFaith(adminDb(), { includeReview: false });
  return (
    <div className="px-4 sm:px-[85px]">
      <section className="mt-[64px] sm:mt-[104px] py-[24px] sm:py-[31px] text-center">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">WALL OF FAITH</h1>
        <p className="mt-4 text-base sm:text-lg text-gray-500">Every step of the journey.</p>
      </section>
      <SpineTimeline groups={groups} />
    </div>
  );
}
