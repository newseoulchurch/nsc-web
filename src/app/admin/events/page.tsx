"use client";

import { useEffect, useState } from "react";

type EventData = {
  title: string;
  date: string;
  time: string;
  status: string;
  img_url?: string;
  content?: string;
};

export default function EventsPage() {
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<EventData>({
    title: "",
    date: "",
    time: "",
    status: "",
    img_url: "",
    content: "",
  });

  useEffect(() => {
    async function getEvents() {
      const res = await fetch("/api/events");
      const data = await res.json();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const enriched = data.map((event: EventData) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        const status = eventDate < today ? "past" : "upcoming";
        return { ...event, status };
      });
      setEvents(enriched);
    }
    getEvents();
  }, []);

  function openNewModal() {
    setEditingIndex(null);
    setForm({
      title: "",
      date: "",
      time: "",
      status: "",
      img_url: "",
      content: "",
    });
    setShowModal(true);
  }

  function openEditModal(index: number) {
    setEditingIndex(index);
    setForm(events[index]);
    setShowModal(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editingIndex !== null) {
      const updated = [...events];
      updated[editingIndex] = form;
      setEvents(updated);
    } else {
      setEvents([...events, form]);
    }
    setShowModal(false);
  }

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">이벤트 관리</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={openNewModal}
        >
          등록
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto">
        {events.map((data, i) => (
          <article
            key={i}
            onClick={() => openEditModal(i)}
            className="min-w-[280px] sm:w-[327px] flex-shrink-0 cursor-pointer"
          >
            <div
              className="h-[220px] sm:h-[266px] pt-[10px] pl-[10px] bg-gray-300 rounded-[12px] bg-cover bg-center relative"
              style={{
                backgroundImage: `url(${data.img_url || "/assets/images/default-event.jpg"})`,
              }}
            >
              <span className="inline-block p-[4px] rounded-[6px] text-[13px] bg-white">
                {data.status}
              </span>
              <div className="w-[56px] h-[1px] mt-[28px] bg-white" />
              <h4 className="mt-[14px] text-lg sm:text-h3 text-white">
                {data.title}
              </h4>
            </div>
            <p className="mt-[10px] text-base font-medium">{data.title}</p>
            <p className="mt-[4px] text-base font-medium">{data.date}</p>
            <p className="mt-[4px] text-lightGray text-sm">{data.time}</p>
          </article>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">
              {editingIndex !== null ? "이벤트 수정" : "이벤트 등록"}
            </h3>
            <form className="space-y-2" onSubmit={handleSubmit}>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                type="text"
                placeholder="제목"
                className="w-full border px-3 py-2 rounded"
                required
              />
              <input
                name="date"
                value={form.date}
                onChange={handleChange}
                type="date"
                className="w-full border px-3 py-2 rounded"
                required
              />
              <input
                name="time"
                value={form.time}
                onChange={handleChange}
                type="text"
                placeholder="시간"
                className="w-full border px-3 py-2 rounded"
                required
              />
              {/* <input
                name="status"
                value={form.status}
                onChange={handleChange}
                type="text"
                placeholder="상태"
                className="w-full border px-3 py-2 rounded"
              /> */}
              {/* <input
                name="img_url"
                value={form.img_url}
                onChange={handleChange}
                type="text"
                placeholder="이미지 URL"
                className="w-full border px-3 py-2 rounded"
              /> */}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // const imageUrl = await uploadFileToBlob(file);
                    // console.log("보낸다", imageUrl);
                    // setForm((prev) => ({ ...prev, img_url: imageUrl }));
                  }
                }}
                className="w-full border px-3 py-2 rounded"
              />

              <input
                name="content"
                value={form.content}
                onChange={handleChange}
                type="text"
                placeholder="기타 내용"
                className="w-full border px-3 py-2 rounded"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 border rounded"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
