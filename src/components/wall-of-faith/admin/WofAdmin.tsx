"use client";
/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { groupTimeline, type WofEvent, type WofYear } from "@/lib/wall-of-faith/model";
import EventForm from "./EventForm";

type Props = { initialYears: WofYear[]; initialEvents: WofEvent[] };

export default function WofAdmin({ initialYears, initialEvents }: Props) {
  const [years, setYears] = useState(initialYears);
  const [events, setEvents] = useState(initialEvents);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [editing, setEditing] = useState<WofEvent | "new" | null>(null);
  const [newYear, setNewYear] = useState({ year: "", theme: "" });
  const [yearMsg, setYearMsg] = useState<string | null>(null);

  const reviewCount = events.filter((e) => e.needsReview).length;
  const groups = useMemo(() => {
    const all = groupTimeline(years, reviewOnly ? events.filter((e) => e.needsReview) : events, { includeReview: true });
    return reviewOnly ? all.filter((g) => g.events.length > 0) : all;
  }, [years, events, reviewOnly]);

  async function saveYear(year: number, theme: string): Promise<boolean> {
    setYearMsg(null);
    const res = await fetch("/api/wall-of-faith/years", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year, theme }),
    });
    const json = await res.json();
    if (!res.ok) {
      setYearMsg(json.error ?? "저장 실패");
      return false;
    }
    setYears((ys) => [...ys.filter((y) => y.year !== year), json.year].sort((a, b) => a.year - b.year));
    setYearMsg(`${year} 저장됨`);
    return true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button className="px-3 py-1.5 text-sm rounded bg-black text-white" onClick={() => setEditing("new")}>+ 이벤트 추가</button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={reviewOnly} onChange={(e) => setReviewOnly(e.target.checked)} />
          Needs review only
          <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">{reviewCount}</span>
        </label>
      </div>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-semibold">Year themes</h2>
        {years.map((y) => (
          <form
            key={y.year}
            className="flex gap-2 items-center"
            onSubmit={(e) => {
              e.preventDefault();
              const theme = (e.currentTarget.elements.namedItem("theme") as HTMLInputElement).value;
              void saveYear(y.year, theme);
            }}
          >
            <span className="w-12 text-sm font-semibold">{y.year}</span>
            <input name="theme" defaultValue={y.theme} maxLength={120} className="flex-1 min-w-0 border rounded px-2 py-1 text-sm" />
            <button className="text-xs border rounded px-2 py-1">저장</button>
          </form>
        ))}
        <form
          className="flex gap-2 items-center pt-2 border-t"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await saveYear(Number(newYear.year), newYear.theme)) setNewYear({ year: "", theme: "" });
          }}
        >
          <input placeholder="Year" inputMode="numeric" value={newYear.year} onChange={(e) => setNewYear({ ...newYear, year: e.target.value })} className="w-20 border rounded px-2 py-1 text-sm" />
          <input placeholder="Theme" value={newYear.theme} onChange={(e) => setNewYear({ ...newYear, theme: e.target.value })} className="flex-1 min-w-0 border rounded px-2 py-1 text-sm" />
          <button className="text-xs border rounded px-2 py-1">연도 추가</button>
        </form>
        {yearMsg && <p className="text-sm text-gray-600">{yearMsg}</p>}
      </section>

      {groups.map((g) => (
        <section key={g.year}>
          <h2 className="text-lg font-bold mb-2">
            {g.year} <span className="text-sm font-normal text-gray-500">{g.theme}</span>
          </h2>
          <ul className="divide-y border rounded-lg">
            {g.events.length === 0 && <li className="p-3 text-sm text-gray-400">No events</li>}
            {g.events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer" onClick={() => setEditing(e)}>
                {e.imageUrl
                  ? <img src={e.imageUrl} alt="" className="w-12 h-12 flex-shrink-0 object-cover rounded" />
                  : <div className="w-12 h-12 flex-shrink-0 rounded bg-[#e8dccb]" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">{e.dateLabel}</p>
                  <p className="font-semibold truncate">{e.title}</p>
                  {e.milestone && <p className="text-xs text-[#8b7355] truncate">✦ {e.milestone}</p>}
                </div>
                {e.needsReview && (
                  <span className="flex-shrink-0 rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">Needs review</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {editing && (
        <EventForm
          event={editing === "new" ? undefined : editing}
          years={years}
          onClose={() => setEditing(null)}
          onSaved={(saved, keepOpen) => {
            setEvents((es) => [...es.filter((x) => x.id !== saved.id), saved]);
            if (!keepOpen) setEditing(null);
          }}
          onDeleted={(id) => {
            setEvents((es) => es.filter((x) => x.id !== id));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
