"use client";

import { useState } from "react";
import { wallOfFaithEvents, WallOfFaithEvent } from "@/data/wall-of-faith";

type FormState = Omit<WallOfFaithEvent, "id"> & { id: string | null };

const emptyForm = (): FormState => ({
  id: null,
  year: new Date().getFullYear(),
  title: "",
  date: "",
  description: "",
  imageUrl: null,
  youtubeUrl: null,
  order: 0,
});

export default function WallOfFaithAdminPage() {
  const [events] = useState<WallOfFaithEvent[]>(wallOfFaithEvents);
  const [form, setForm] = useState<FormState | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave() {
    if (!form) return;
    console.log("[Wall of Faith Admin] save (stubbed):", form);
    showToast("Supabase not connected yet — changes not saved.");
    setForm(null);
  }

  function handleDelete(id: string) {
    console.log("[Wall of Faith Admin] delete (stubbed):", id);
    showToast("Supabase not connected yet — changes not saved.");
  }

  const years = [...new Set(events.map((e) => e.year))].sort((a, b) => a - b);

  return (
    <div className="px-4 sm:px-[85px] py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Wall of Faith 관리</h1>
        <button
          onClick={() => setForm(emptyForm())}
          className="bg-black text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          + Add Event
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-800 text-white text-sm px-4 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Event list grouped by year */}
      {years.map((year) => (
        <div key={year} className="mb-10">
          <h2 className="text-lg font-bold mb-3 border-b pb-2">{year}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 pr-4 font-medium">Order</th>
                  <th className="pb-2 pr-4 font-medium">Title</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Image</th>
                  <th className="pb-2 pr-4 font-medium">YouTube</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events
                  .filter((e) => e.year === year)
                  .sort((a, b) => a.order - b.order)
                  .map((event) => (
                    <tr key={event.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-gray-400">{event.order}</td>
                      <td className="py-2 pr-4 font-medium">{event.title}</td>
                      <td className="py-2 pr-4 text-gray-500">{event.date}</td>
                      <td className="py-2 pr-4">
                        {event.imageUrl ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {event.youtubeUrl ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2 flex gap-2">
                        <button
                          onClick={() => setForm({ ...event })}
                          className="text-xs px-3 py-1 border rounded hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="text-xs px-3 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Edit / Add form modal */}
      {form && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">
              {form.id ? "Edit Event" : "Add Event"}
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Year</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Order</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Date</label>
                <input
                  type="text"
                  value={form.date}
                  placeholder="e.g. Mar 1, 2024"
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">YouTube URL (optional)</label>
                <input
                  type="url"
                  value={form.youtubeUrl ?? ""}
                  placeholder="https://youtube.com/watch?v=..."
                  onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value || null })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Image Upload</label>
                <div className="w-full border rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed">
                  Coming soon — available once Supabase is connected
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setForm(null)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
