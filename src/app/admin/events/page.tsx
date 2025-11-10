"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { fireStore } from "@/lib/firebase";

type EventData = {
  id?: string;
  title: string;
  date: string;
  time: string;
  img_url?: string;
  content?: string;
  link?: string;
};

export default function EventsPage() {
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<EventData>({
    title: "",
    date: "",
    time: "",
    img_url: "",
    content: "",
    link: "",
  });

  // const onClickUpLoadButton = async () => {
  //   //    addDoc(collection(db       , "컬렉션이름") , { 추가할 데이터 }
  //   await addDoc(collection(fireStore, `events`), {
  //     value,
  //   });
  // };

  useEffect(() => {
    async function getEvents() {
      const res = await getDocs(collection(fireStore, `events`), {});
      const events = res.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const sortedEvents = events.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime(); // 최신순
      });
      console.log("events ID:", sortedEvents);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const enriched = sortedEvents.map((event: EventData) => {
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
      img_url: "",
      content: "",
      link: "",
    });
    setShowModal(true);
  }

  function openEditModal(index: number) {
    if (!events[index].id) {
      alert("수정할 문서의 ID가 없습니다. 새로고침 후 다시 시도해주세요.");
    }

    setEditingIndex(index);
    setForm(events[index]);
    setShowModal(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editingIndex !== null) {
      const updated = [...events];
      updated[editingIndex] = form;
      setEvents(updated);
    }
    try {
      if (editingIndex !== null) {
        const docRef = doc(fireStore, "events", form?.id);
        await updateDoc(docRef, {
          ...form,
          updatedAt: new Date().toISOString(),
        });
        console.log("기존 문서 업데이트 완료:", form.id);

        const updated = [...events];
        updated[editingIndex] = form;
        setEvents(updated);
      } else {
        const docRef = await addDoc(collection(fireStore, "events"), {
          ...form,
          createdAt: new Date().toISOString(),
        });
        console.log("새 문서 생성 완료:", docRef.id);

        setEvents([...events, { ...form, id: docRef.id }]); // 새 문서 로컬 상태에 추가
      }
    } catch (err) {
      console.error("Firestore 저장 중 에러:", err);
      alert("이벤트 저장 실패!");
    }
    setShowModal(false);
  }

  function openEditModalById(id: string) {
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1 || !events[idx].id) {
      alert("수정할 문서의 ID가 없습니다. 새로고침 후 다시 시도해주세요.");
      return;
    }
    setEditingIndex(idx);
    setForm(events[idx]);
    setShowModal(true);
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
        {events.map((data) => (
          <article
            key={data.id ?? data.title}
            onClick={() => openEditModalById(data.id!)}
            className="min-w-[280px] sm:w-[327px] flex-shrink-0 cursor-pointer"
          >
            <div
              className="h-[220px] sm:h-[266px] pt-[10px] pl-[10px] bg-gray-300 rounded-[12px] bg-cover bg-center relative" // z-0 제거!
              style={{
                backgroundImage:
                  data.img_url && data.img_url !== ""
                    ? `url(${data.img_url})`
                    : "none",
              }}
            >
              {(!data.img_url || data.img_url === "") && (
                <img
                  src="/assets/images/events/event1.png"
                  className="absolute top-0 left-0 w-full h-full object-cover rounded-[12px] z-0"
                />
              )}

              <div className="w-[56px] h-[1px] mt-[28px] bg-white relative z-10" />
              <h4 className="mt-[14px] text-lg sm:text-h3 text-white relative z-10">
                {data.title}
              </h4>
            </div>
            <p className="mt-[10px] text-base font-medium">{data.title}</p>
            <p className="mt-[4px] text-base font-medium">{data.date}</p>
            <p className="mt-[4px] text-lightGray text-sm">{data.time}</p>
            <p className="mt-[4px] text-base text-sm">
              {data.link?.slice(0, 30) + "..."}
            </p>
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
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (!form.date) {
                    alert("날짜를 먼저 선택해주세요!");
                    return;
                  }

                  try {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("date", form.date);

                    const res = await fetch("/api/events-upload", {
                      method: "POST",
                      body: formData,
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "업로드 실패");

                    // 캐시 방지 쿼리 붙이기
                    const urlWithBust = `${data.url}?v=${Date.now()}`;

                    // 1) 폼 미리보기 즉시 반영
                    setForm((prev) => ({ ...prev, img_url: urlWithBust }));

                    // 2) 편집 모드라면 리스트에도 즉시 반영(카드 즉시 변경)
                    if (editingIndex !== null) {
                      setEvents((prev) => {
                        const copy = [...prev];
                        copy[editingIndex!] = {
                          ...copy[editingIndex!],
                          img_url: urlWithBust,
                        };
                        return copy;
                      });
                    }
                  } catch (err) {
                    console.error("이미지 업로드 에러:", err);
                    alert("이미지 업로드 실패!");
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
              <input
                name="link"
                value={form.link}
                onChange={handleChange}
                type="url"
                placeholder="관련 링크"
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
