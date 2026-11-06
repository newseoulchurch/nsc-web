import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fromRow, groupTimeline, WOF_EVENT_COLUMNS,
  type WofRow, type WofYear, type WofEvent, type WofYearGroup,
} from "./model";

// Throws on a failed query (unlike loadBoard), so a broken read shows the error page instead of an empty wall.
export async function loadAdminData(db: SupabaseClient): Promise<{ years: WofYear[]; events: WofEvent[] }> {
  const [y, e] = await Promise.all([
    db.from("wall_of_faith_years").select("year, theme").order("year"),
    db.from("wall_of_faith_events").select(WOF_EVENT_COLUMNS).order("year").order("sort_date").order("title"),
  ]);
  if (y.error) throw new Error(`wall_of_faith_years: ${y.error.message}`);
  if (e.error) throw new Error(`wall_of_faith_events: ${e.error.message}`);
  return { years: y.data as WofYear[], events: (e.data as unknown as WofRow[]).map(fromRow) };
}

export async function loadWallOfFaith(db: SupabaseClient, opts: { includeReview: boolean }): Promise<WofYearGroup[]> {
  const { years, events } = await loadAdminData(db);
  return groupTimeline(years, events, opts);
}
