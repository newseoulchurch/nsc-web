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
  status?: "past" | "upcoming";
};

const TARGET_IMAGE_SIZE = 500 * 1024; // 500KB

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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [imageMessage, setImageMessage] = useState<string | null>(null);

  useEffect(() => {
    async function getEvents() {
      const res = await getDocs(collection(fireStore, "events"));
      const fetchedEvents = res.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<EventData, "id">),
      }));

      const sortedEvents = fetchedEvents.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime(); // 최신순
      });

      console.log("events ID:", sortedEvents);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const enriched = sortedEvents.map((event) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        const status = eventDate < today ? "past" : "upcoming";

        return {
          ...event,
          status,
        } as EventData;
      });

      setEvents(enriched);
    }

    getEvents();
  }, []);

  function openNewModal() {
    setEditingIndex(null);
    setImageFile(null);
    setImageMessage(null);
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

  function openEditModalById(id: string) {
    const idx = events.findIndex((e) => e.id === id);

    if (idx === -1 || !events[idx].id) {
      alert("수정할 문서의 ID가 없습니다. 새로고침 후 다시 시도해주세요.");
      return;
    }

    setEditingIndex(idx);
    setImageFile(null);
    setImageMessage(null);
    setForm(events[idx]);
    setShowModal(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const compressImageToUnder500KB = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("이미지 파일만 업로드할 수 있습니다.");
    }

    // 이미 500KB 이하이면 그대로 업로드
    if (file.size <= TARGET_IMAGE_SIZE) {
      return file;
    }

    const imageBitmap = await createImageBitmap(file);

    let width = imageBitmap.width;
    let height = imageBitmap.height;

    // 1차 해상도 제한
    const MAX_WIDTH = 1600;

    if (width > MAX_WIDTH) {
      const ratio = MAX_WIDTH / width;
      width = MAX_WIDTH;
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 생성에 실패했습니다.");
    }

    const renderToBlob = async (
      targetWidth: number,
      targetHeight: number,
      quality: number,
    ): Promise<Blob> => {
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // PNG 투명 배경이 JPEG 변환 시 검게 나오는 것을 방지
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });

      if (!blob) {
        throw new Error("이미지 압축에 실패했습니다.");
      }

      return blob;
    };

    let blob = await renderToBlob(width, height, 0.85);

    // 1단계: 품질을 낮추며 압축
    let quality = 0.75;

    while (blob.size > TARGET_IMAGE_SIZE && quality >= 0.35) {
      blob = await renderToBlob(width, height, quality);
      quality -= 0.1;
    }

    // 2단계: 그래도 크면 해상도 축소
    while (blob.size > TARGET_IMAGE_SIZE && width > 600) {
      width = Math.round(width * 0.85);
      height = Math.round(height * 0.85);
      blob = await renderToBlob(width, height, 0.5);
    }

    // 3단계: 마지막 강제 축소
    while (blob.size > TARGET_IMAGE_SIZE && width > 400) {
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
      blob = await renderToBlob(width, height, 0.4);
    }

    if (blob.size > TARGET_IMAGE_SIZE) {
      throw new Error(
        `이미지를 500KB 이하로 압축하지 못했습니다. 현재 용량: ${(
          blob.size / 1024
        ).toFixed(0)}KB`,
      );
    }

    const originalName = file.name.replace(/\.[^/.]+$/, "");

    return new File([blob], `${originalName}-compressed.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    setImageFile(null);
    setImageMessage(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageMessage("이미지 파일만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    setIsCompressingImage(true);

    try {
      const compressedFile = await compressImageToUnder500KB(file);

      setImageFile(compressedFile);

      setImageMessage(
        `이미지 압축 완료: ${(file.size / 1024).toFixed(0)}KB → ${(
          compressedFile.size / 1024
        ).toFixed(0)}KB`,
      );

      const previewUrl = URL.createObjectURL(compressedFile);

      setForm((prev) => ({
        ...prev,
        img_url: previewUrl,
      }));
    } catch (err: any) {
      console.error("이미지 압축 에러:", err);
      alert(err.message || "이미지 압축 실패!");
      setImageMessage(err.message || "이미지 압축 실패!");
    } finally {
      setIsCompressingImage(false);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isCompressingImage) {
      alert("이미지 압축이 끝난 뒤 저장해주세요.");
      return;
    }

    try {
      let finalImageUrl = form.img_url || "";

      // 새 이미지가 선택된 경우에만 서버 API로 Blob 업로드
      if (imageFile) {
        if (imageFile.size > TARGET_IMAGE_SIZE) {
          alert("이미지 용량이 500KB를 초과하여 업로드할 수 없습니다.");
          return;
        }

        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("date", form.date || "no-date");

        const res = await fetch("/api/events-upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "이미지 업로드 실패");
        }

        finalImageUrl = `${data.url}?v=${Date.now()}`;
      }

      const saveData = {
        ...form,
        img_url: finalImageUrl,
      };

      if (editingIndex !== null) {
        if (!form.id) {
          alert("수정할 문서의 ID가 없습니다. 새로고침 후 다시 시도해주세요.");
          return;
        }

        const docRef = doc(fireStore, "events", form.id);

        await updateDoc(docRef, {
          ...saveData,
          updatedAt: new Date().toISOString(),
        });

        const updated = [...events];
        updated[editingIndex] = {
          ...saveData,
          id: form.id,
        };

        setEvents(updated);
      } else {
        const docRef = await addDoc(collection(fireStore, "events"), {
          ...saveData,
          createdAt: new Date().toISOString(),
        });

        setEvents([
          ...events,
          {
            ...saveData,
            id: docRef.id,
          },
        ]);
      }

      setShowModal(false);
      setImageFile(null);
      setImageMessage(null);
    } catch (err: any) {
      console.error("이벤트 저장 중 에러:", err);
      alert(err.message || "이벤트 저장 실패!");
    }
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
              className="h-[220px] sm:h-[266px] pt-[10px] pl-[10px] bg-gray-300 rounded-[12px] bg-cover bg-center relative"
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
                  alt=""
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
              {data.link ? data.link.slice(0, 30) + "..." : ""}
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
                onChange={handleImageChange}
                className="w-full border px-3 py-2 rounded"
              />

              {isCompressingImage && (
                <p className="text-sm text-gray-500">
                  이미지를 500KB 이하로 압축하고 업로드하는 중입니다...
                </p>
              )}

              {imageMessage && (
                <p className="text-sm text-gray-500">{imageMessage}</p>
              )}

              {form.img_url && (
                <div
                  className="w-full h-[160px] rounded bg-cover bg-center border"
                  style={{ backgroundImage: `url(${form.img_url})` }}
                />
              )}

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
                  onClick={() => {
                    setShowModal(false);
                    setImageFile(null);
                    setImageMessage(null);
                  }}
                  className="px-3 py-1 border rounded"
                >
                  취소
                </button>

                <button
                  type="submit"
                  disabled={isCompressingImage}
                  className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-60"
                >
                  {isCompressingImage ? "이미지 처리 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
