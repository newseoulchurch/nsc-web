// Client component: rendered only inside WofAdmin ("use client").
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { WofEvent, WofYear } from "@/lib/wall-of-faith/model";
import { compressImage } from "./compressImage";

type Props = {
  event?: WofEvent;
  years: WofYear[];
  onSaved: (e: WofEvent) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
};

type Draft = Omit<WofEvent, "id">;

const blank = (year: number): Draft => ({
  slug: "", year, sortDate: `${year}-01-01`, dateLabel: "", title: "", description: "",
  milestone: null, significance: null, imageUrl: null, youtubeUrl: null, needsReview: true,
});

export default function EventForm({ event, years, onSaved, onDeleted, onClose }: Props) {
  const [f, setF] = useState<Draft>(event ?? blank(years.at(-1)?.year ?? new Date().getFullYear()));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      // imageUrl is never sent from the form; photos go through the upload route.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { imageUrl, ...fields } = f;
      const body = { ...fields, slug: event ? f.slug : "" };
      const res = await fetch(event ? `/api/wall-of-faith/events/${event.id}` : "/api/wall-of-faith/events", {
        method: event ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "저장 실패");
      let saved: WofEvent = json.event;
      if (file) {
        const fd = new FormData();
        fd.append("file", await compressImage(file));
        fd.append("eventId", saved.id);
        const up = await fetch("/api/wall-of-faith/upload", { method: "POST", body: fd });
        const upJson = await up.json();
        if (!up.ok) {
          onSaved(saved); // text is saved; keep the list in sync before reporting the photo error
          throw new Error(`글은 저장됨, 사진 실패: ${upJson.error}`);
        }
        saved = { ...saved, imageUrl: upJson.url };
      }
      onSaved(saved);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!event || !confirm(`"${event.title}" 삭제할까요? 사진도 함께 삭제됩니다.`)) return;
    setBusy(true);
    const res = await fetch(`/api/wall-of-faith/events/${event.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) onDeleted(event.id);
    else setErr((await res.json()).error ?? "삭제 실패");
  }

  const input = "w-full border rounded px-2 py-1.5 text-sm";
  const label = "block text-xs font-semibold text-gray-500 mb-1";
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-xl p-5 space-y-3 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold">{event ? "이벤트 수정" : "이벤트 추가"}</h2>
        <div className="grid grid-cols-2 gap-3">
          <label><span className={label}>Year</span>
            <select className={input} value={f.year} onChange={(e) => set("year", Number(e.target.value))}>
              {years.map((y) => <option key={y.year} value={y.year}>{y.year}</option>)}
            </select>
          </label>
          <label><span className={label}>Sort date</span>
            <input type="date" className={input} value={f.sortDate} onChange={(e) => set("sortDate", e.target.value)} />
          </label>
        </div>
        <label className="block"><span className={label}>Date label (shown)</span>
          <input className={input} maxLength={60} value={f.dateLabel} onChange={(e) => set("dateLabel", e.target.value)} placeholder="Mar 25–28, 2024" />
        </label>
        <label className="block"><span className={label}>Title</span>
          <input className={input} maxLength={120} value={f.title} onChange={(e) => set("title", e.target.value)} />
        </label>
        <label className="block"><span className={label}>Description ({f.description.length}/1000)</span>
          <textarea className={input} rows={3} maxLength={1000} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </label>
        <label className="block"><span className={label}>Spiritual milestone (badge)</span>
          <input className={input} maxLength={60} value={f.milestone ?? ""} onChange={(e) => set("milestone", e.target.value || null)} />
        </label>
        <label className="block"><span className={label}>Spiritual significance ({(f.significance ?? "").length}/400)</span>
          <textarea className={input} rows={2} maxLength={400} value={f.significance ?? ""} onChange={(e) => set("significance", e.target.value || null)} />
        </label>
        <label className="block"><span className={label}>YouTube URL</span>
          <input className={input} value={f.youtubeUrl ?? ""} onChange={(e) => set("youtubeUrl", e.target.value || null)} />
        </label>
        <div><span className={label}>Photo</span>
          {f.imageUrl && !file && <img src={f.imageUrl} alt="" className="w-24 h-24 object-cover rounded mb-2" />}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.needsReview} onChange={(e) => set("needsReview", e.target.checked)} />
          Needs review (hidden from the public page)
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-between pt-2">
          {event ? <button className="text-sm text-red-600" disabled={busy} onClick={remove}>삭제</button> : <span />}
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm border rounded" onClick={onClose} disabled={busy}>취소</button>
            <button className="px-3 py-1.5 text-sm rounded bg-black text-white disabled:opacity-50" onClick={save} disabled={busy}>
              {busy ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
