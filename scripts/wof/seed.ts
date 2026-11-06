// scripts/wof/seed.ts — initial content for the wall_of_faith tables.
// Base = src/data/wall-of-faith.ts; OVERRIDES = sort dates + Margot's agenda-doc part 5 (doc last
// edited 2026-10-23); ADDITIONS = drafts, all needs_review.
// Deleted after the migration is generated and committed; the SQL file is the record.
import { wallOfFaithEvents } from "../../src/data/wall-of-faith.ts";
import { slugify, type EventInput, type WofYear } from "../../src/lib/wall-of-faith/model.ts";

export const seedYears: WofYear[] = [
  { year: 2023, theme: "Made New to Make New" },
  { year: 2024, theme: "Walking Toward the Call, Calling All Who Walk" },
  { year: 2025, theme: "Made for More" },
  { year: 2026, theme: "Be · Ready · Be Ready" },
];

// Key: `${year}|${title}|${date}` exactly as in src/data/wall-of-faith.ts.
type Override = { sortDate: string; title?: string; dateLabel?: string; milestone?: string; significance?: string };
export const OVERRIDES: Record<string, Override> = {
  "2023|Opening Prayer|Dec 2022 – May 14, 2023": { sortDate: "2022-12-01", milestone: "Prayer", significance: "Remembering that the church began in dependence on God and recognizing the vital role of intercessory prayer in building His community." },
  "2023|Commission Service|May 14, 2023": { sortDate: "2023-05-14", significance: "Celebrating God’s grace in establishing NSC and embracing His calling and mission together as a church." },
  "2023|Summer Night|July 2023": { sortDate: "2023-07-01", significance: "Nurturing friendship and a sense of belonging in Christ through shared joy and fellowship." },
  "2023|Forerunner Retreat|Aug 10–12, 2023": { sortDate: "2023-08-10", milestone: "Mt. Yongmun", significance: "Preparing hearts and lives to serve like Jesus and growing in dependence on God for the ministry entrusted to us." },
  "2023|Fall Festival|Sep 17, 2023": { sortDate: "2023-09-17", significance: "Expressing God’s love through hospitality, warmly welcoming newcomers and sharing food and joy together." },
  "2023|Chuseok Experience|Sep 30, 2023": { sortDate: "2023-09-30", significance: "Extending family-like hospitality to international students and practicing love for our neighbors across cultural differences." },
  "2023|DT Phase 1, Cohort 1|Oct 2023": { sortDate: "2023-10-01" },
  "2023|Thanksgiving|Nov 25, 2023": { sortDate: "2023-11-25", significance: "Giving thanks for God’s provision and celebrating our unity as one body in Christ through the sharing of cultures and food." },
  "2023|Christmas|Dec 25, 2023": { sortDate: "2023-12-25", milestone: "Family worship", significance: "Celebrating the love of Jesus, who came to dwell among us, and worshiping together as one family in Christ." },
  "2023|New Year Service|Jan 1, 2024": { sortDate: "2024-01-01", significance: "Thanking God for His guidance throughout the past year and entrusting the coming year to His faithfulness." },
  "2024|New Year Prayer Walk|Jan 2–5, 2024": { sortDate: "2024-01-02", significance: "Entrusting our steps in the new year to God and interceding for the city with a heart shaped by His love." },
  "2024|Life Group Olympic|Jan 28, 2024": { sortDate: "2024-01-28", significance: "Experiencing the joy and unity of being one body as members with different gifts cooperate and encourage one another." },
  "2024|Membership Class|Feb 4 & 18, 2024": { sortDate: "2024-02-04", significance: "Sharing in the church’s vision and faith, putting down roots in the community, and committing to love and serve one another faithfully." },
  "2024|Freedom Prayer Walk|Mar 1, 2024": { sortDate: "2024-03-01", significance: "Lifting the nation and city to God and praying for His peace, restoration, and true freedom to take root in this land." },
  "2024|Passion Week Early Morning Prayer|Mar 25–28, 2024": { sortDate: "2024-03-25", significance: "Offering the first moments of the day to God, reflecting on Jesus’ love and sacrifice on the cross, and responding in repentance and prayer." },
  "2024|Good Friday Service|Mar 29, 2024": { sortDate: "2024-03-29", milestone: "Washing feet", significance: "Learning from Jesus’ humility and service through foot washing, and remembering His saving sacrifice through the sharing of a Passover meal." },
  "2024|Easter Sunday|Mar 31, 2024": { sortDate: "2024-03-31", milestone: "Hope hunt", significance: "Celebrating Jesus’ resurrection and the joy of new life, and learning to see our everyday lives and city through the hope of the risen Christ." },
  "2024|DURE (두레) Fasting Retreat|Apr 10–13, 2024": { sortDate: "2024-04-10", milestone: "Clicker" },
  "2024|Breakthrough Retreat|May 10–12, 2024": { sortDate: "2024-05-10", milestone: "7hrs worship", significance: "Reflecting on God’s faithfulness in leading the church, sharing rest and fellowship, and renewing our calling as a community." },
  // "Early 2024": sort keeps its current position between Breakthrough and Sports Monster.
  "2024|DT Phase 2, Cohort 1|Early 2024": { sortDate: "2024-05-12" },
  "2024|Sports Monster Bungae (번개) Fellowship|May 15, 2024": { sortDate: "2024-05-15", title: "Sports Monster 1st Bungae (번개) Fellowship" },
  "2024|Mission Fair|Jun 9, 2024": { sortDate: "2024-06-09" },
  "2024|Palawan Mission|Jul 22–27, 2024": { sortDate: "2024-07-22", significance: "Partnering with local ministry workers to share the gospel in word and deed and participating in God’s love for all nations across cultures and borders." },
  "2024|Freedom Prayer Walk|Aug 14–15, 2024": { sortDate: "2024-08-14" },
  "2024|Haven Staff Retreat|Aug 23–24, 2024": { sortDate: "2024-08-23", milestone: "Camping" },
  "2024|Christmas Play|Dec 25, 2024": { sortDate: "2024-12-25", title: "Christmas", milestone: "Christmas play" },
  "2024|New Year Service|Dec 31, 2024": { sortDate: "2024-12-31" },
  "2025|Glory Retreat|Feb 7–9, 2025": { sortDate: "2025-02-07", milestone: "Ice bath" },
  "2025|NSB (New Seoul Basketball) Begins|Mar 13, 2025": { sortDate: "2025-03-13" },
  "2025|Town Hall Meeting|Apr 6, 2025": { sortDate: "2025-04-06" },
  "2025|Passion Week|Apr 14–17, 2025": { sortDate: "2025-04-14" },
  "2025|Easter Sunday|Apr 20, 2025": { sortDate: "2025-04-20", milestone: "Easter play" },
  "2025|ReadyCall|May 6, 2025": { sortDate: "2025-05-06" },
  "2025|2nd Year Anniversary|May 11, 2025": { sortDate: "2025-05-11" },
  "2025|Pray 4 Korea|Jun 4–8, 2025": { sortDate: "2025-06-04" },
  // "2025 (ongoing)": sort keeps its current position after Pray 4 Korea.
  "2025|Bungae Fellowship|2025 (ongoing)": { sortDate: "2025-06-20" },
  "2025|Indonesia Mission|Jun 30 – Jul 7, 2025": { sortDate: "2025-06-30", milestone: "Basketball" },
  "2025|Korea Mission|Jul 28 – Aug 1, 2025": { sortDate: "2025-07-28", milestone: "Sunduk Orphanage ministry" },
  "2025|NSK VBS (Vacation Bible School)|Jul 28 – Aug 1, 2025": { sortDate: "2025-08-09", dateLabel: "Aug 9–10, 2025", milestone: "Light" },
  "2025|Yongmun Mountain|Aug 15, 2025": { sortDate: "2025-08-15" },
  "2025|Journey Retreat|Oct 9–12, 2025": { sortDate: "2025-10-09", milestone: "Pilgrim’s progress" },
  "2025|Christmas Project|December 2025": { sortDate: "2025-12-01", milestone: "Guardians system for Sunduk Orphanage kids" },
  "2025|Christmas Film|Dec 25, 2025": { sortDate: "2025-12-25", title: "Christmas", milestone: "Christmas film" },
};

type Addition = Omit<EventInput, "slug" | "imageUrl" | "youtubeUrl" | "needsReview">;

// Drafts. Every entry is seeded needs_review = true (hidden until reviewed in the admin).
export const ADDITIONS: Addition[] = [
  // src: Drive photo folder "2024.03.10_Discipleship Sunday"
  { year: 2024, sortDate: "2024-03-10", dateLabel: "Mar 10, 2024", title: "Discipleship Sunday", milestone: null, significance: null,
    description: "A Sunday service centered on discipleship and what it means to follow Jesus together." },
  // src: Drive photo folder "2024_SolMenDT Phase 1_Cohort 2" (exact dates unknown; "SolMen" to confirm)
  { year: 2024, sortDate: "2024-01-01", dateLabel: "2024", title: "DT Phase 1, Cohort 2", milestone: null, significance: null,
    description: "The second cohort began Phase 1 of NSC's Discipleship Training." },
  // src: Margot's agenda doc part 5 (Oct 26, "Young people's gathering") + Drive folder "2024_New Glow"
  { year: 2024, sortDate: "2024-10-26", dateLabel: "Oct 26, 2024", title: "New Glow", milestone: "Young people’s gathering", significance: null,
    description: "New Glow brought the young people of NSC together for a gathering of their own." },
  // src: Drive photo folder "2025_DT Phase 1_Cohort 3" (exact dates unknown)
  { year: 2025, sortDate: "2025-01-01", dateLabel: "2025", title: "DT Phase 1, Cohort 3", milestone: null, significance: null,
    description: "The third cohort began Phase 1 of NSC's Discipleship Training." },
  // src: Drive photo folder "2025.04.06_Baptism"
  { year: 2025, sortDate: "2025-04-06", dateLabel: "Apr 6, 2025", title: "Baptism", milestone: null, significance: null,
    description: "Members were baptized and publicly declared their faith in Jesus before the church." },
  // src: ~/chanos/workspaces/nsc/be-ready/vision/summary.md:8,14-18 (Sermon 1, Sept 13)
  { year: 2026, sortDate: "2026-09-13", dateLabel: "Sep 13, 2026", title: "Be Ready Season Begins", milestone: null, significance: null,
    description: "The Be Ready season opened with “The Be Ready Manifesto,” the first message of the Acts series “Legacy,” introducing four pillars: Reach, Regions, Recalibrate, and Record." },
  // src: ~/chanos/workspaces/nsc/be-ready/data/raw/meeting-notes/2026-09-06.md:9-16; be-ready/recalibrate/HANDOFF.md:93
  { year: 2026, sortDate: "2026-09-20", dateLabel: "Sep 20, 2026", title: "Fall Festival", milestone: null, significance: null,
    description: "NSC welcomed neighbors and newcomers from many nations to the Fall Festival, sharing food and fellowship together at the church." },
  // src: ~/chanos/workspaces/nsc/be-ready/retreat/trading-cards/NOTES.md:3; be-ready/docs/superpowers/specs/2026-10-07-prayer-figure-cards-design.md
  { year: 2026, sortDate: "2026-10-08", dateLabel: "Oct 8–11, 2026", title: "Surrender Retreat", milestone: null, significance: null,
    description: "A camping-style fasting retreat at Dure Monastery, with prayer stations drawn from the lives of the Church Fathers." },
  // src: ~/chanos/workspaces/nsc/dt/dt3/HANDOFF.md:6,13
  { year: 2026, sortDate: "2026-10-24", dateLabel: "Oct 24, 2026", title: "DT Phase 3 Begins", milestone: null, significance: null,
    description: "Phase 3 of Discipleship Training began under the theme “Covering.”" },
];

export function seedEvents(): EventInput[] {
  const base: EventInput[] = wallOfFaithEvents.map((e) => {
    const key = `${e.year}|${e.title}|${e.date}`;
    const o = OVERRIDES[key];
    if (!o) throw new Error(`no override for ${key}`);
    return {
      slug: e.id, year: e.year, sortDate: o.sortDate, dateLabel: o.dateLabel ?? e.date,
      title: o.title ?? e.title, description: e.description, milestone: o.milestone ?? null,
      significance: o.significance ?? null, imageUrl: null, youtubeUrl: e.youtubeUrl, needsReview: false,
    };
  });
  const added: EventInput[] = ADDITIONS.map((a) => ({
    ...a, slug: slugify(a.year, a.title), imageUrl: null, youtubeUrl: null, needsReview: true,
  }));
  return [...base, ...added];
}
