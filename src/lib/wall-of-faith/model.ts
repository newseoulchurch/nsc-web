import { z } from "zod";

export type WofEvent = {
  id: string; slug: string; year: number; sortDate: string; dateLabel: string;
  title: string; description: string; milestone: string | null; significance: string | null;
  imageUrl: string | null; youtubeUrl: string | null; needsReview: boolean;
};
export type WofYear = { year: number; theme: string };
export type WofYearGroup = WofYear & { events: WofEvent[] };

export type WofRow = {
  id: string; slug: string; year: number; sort_date: string; date_label: string;
  title: string; description: string; milestone: string | null; significance: string | null;
  image_url: string | null; youtube_url: string | null; needs_review: boolean;
};

export const WOF_EVENT_COLUMNS =
  "id, slug, year, sort_date, date_label, title, description, milestone, significance, image_url, youtube_url, needs_review";

export function fromRow(r: WofRow): WofEvent {
  return {
    id: r.id, slug: r.slug, year: r.year, sortDate: r.sort_date, dateLabel: r.date_label,
    title: r.title, description: r.description ?? "", milestone: r.milestone, significance: r.significance,
    imageUrl: r.image_url, youtubeUrl: r.youtube_url, needsReview: r.needs_review,
  };
}

// Missing or blank → null. (In eventPatchSchema the .partial() wrapper sees undefined first, so an
// omitted field stays omitted there; only the full create schema turns it into null.)
const blankToNull = (v: unknown) => (v === undefined || (typeof v === "string" && v.trim() === "") ? null : v);
const optText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable());
const httpsUrl = z.preprocess(
  blankToNull,
  z.string().url().refine((u) => u.startsWith("https://"), "must be https").nullable(),
);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}, "invalid date");

const eventShape = {
  slug: z.string().regex(/^[a-z0-9-]+$/).max(80),
  year: z.number().int().min(2022).max(2100),
  sortDate: isoDate,
  dateLabel: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(120),
  description: z.preprocess((v) => (v == null ? "" : v), z.string().trim().max(1000)),
  milestone: optText(60),
  significance: optText(400),
  imageUrl: httpsUrl,
  youtubeUrl: httpsUrl,
  needsReview: z.boolean(),
};

export const eventInputSchema = z.object(eventShape).strict();
export type EventInput = z.infer<typeof eventInputSchema>;

export const eventPatchSchema = z
  .object(eventShape).partial().strict()
  .refine((o) => Object.keys(o).length > 0, "nothing to update");
export type EventPatch = z.infer<typeof eventPatchSchema>;

export const yearInputSchema = z.object({
  year: z.number().int().min(2022).max(2100),
  theme: z.string().trim().min(1).max(120),
}).strict();

const COLUMN: Record<keyof EventInput, keyof WofRow> = {
  slug: "slug", year: "year", sortDate: "sort_date", dateLabel: "date_label", title: "title",
  description: "description", milestone: "milestone", significance: "significance",
  imageUrl: "image_url", youtubeUrl: "youtube_url", needsReview: "needs_review",
};

export function toRowPatch(p: EventPatch): Partial<WofRow> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) out[COLUMN[k as keyof EventInput]] = v;
  return out as Partial<WofRow>;
}

export function toRowValues(i: EventInput): Omit<WofRow, "id"> {
  return toRowPatch(i) as Omit<WofRow, "id">;
}

// Body the admin form sends: every editable field, never id (path param) or imageUrl (upload route).
export function eventFormPayload(e: Omit<WofEvent, "id"> & { id?: string }): Omit<WofEvent, "id" | "imageUrl"> {
  return {
    slug: e.slug, year: e.year, sortDate: e.sortDate, dateLabel: e.dateLabel, title: e.title,
    description: e.description, milestone: e.milestone, significance: e.significance,
    youtubeUrl: e.youtubeUrl, needsReview: e.needsReview,
  };
}

// "title, youtubeUrl" from a zod flatten() result, for the admin's error line.
export function describeIssues(issues: unknown): string {
  const fe = (issues as { fieldErrors?: Record<string, unknown> } | undefined)?.fieldErrors;
  return fe ? Object.keys(fe).join(", ") : "";
}

export function slugify(year: number, title: string): string {
  const tail = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${year}-${tail || "event"}`.slice(0, 80);
}

export function groupTimeline(
  years: WofYear[], events: WofEvent[], opts: { includeReview: boolean },
): WofYearGroup[] {
  const theme = new Map(years.map((y) => [y.year, y.theme]));
  const byYear = new Map<number, WofEvent[]>();
  for (const e of events) {
    if (e.needsReview && !opts.includeReview) continue;
    byYear.set(e.year, [...(byYear.get(e.year) ?? []), e]);
  }
  if (opts.includeReview) for (const y of years) if (!byYear.has(y.year)) byYear.set(y.year, []);
  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, list]) => ({
      year,
      theme: theme.get(year) ?? "",
      events: [...list].sort((a, b) =>
        a.sortDate === b.sortDate ? a.title.localeCompare(b.title) : a.sortDate < b.sortDate ? -1 : 1),
    }));
}
