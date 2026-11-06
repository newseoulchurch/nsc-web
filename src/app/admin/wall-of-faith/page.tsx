import WofAdmin from "@/components/wall-of-faith/admin/WofAdmin";
import { loadAdminData } from "@/lib/wall-of-faith/load";
import { adminDb } from "@/lib/wall-of-faith/server";

export const dynamic = "force-dynamic";

export default async function WallOfFaithAdminPage() {
  const { years, events } = await loadAdminData(adminDb());
  return (
    <div className="px-4 sm:px-8 py-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-widest uppercase mb-6">Wall of Faith 관리</h1>
      <WofAdmin initialYears={years} initialEvents={events} />
    </div>
  );
}
