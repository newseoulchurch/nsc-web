"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BulletinsPage() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  // 예시 데이터
  const bulletins = [
    { date: "2025-05-05", title: "주보 제목 1" },
    { date: "2025-05-12", title: "주보 제목 2" },
  ];

  return (
    <div className="p-10">
      <h2 className="text-xl font-bold mb-4">주보 관리</h2>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => setShowModal(true)}
      >
        등록
      </button>

      <ul className="mt-6 space-y-2">
        {bulletins.map((b) => (
          <li
            key={b.date}
            className="border p-4 rounded hover:bg-gray-50 cursor-pointer"
            onClick={() => router.push(`/admin/bulletins/${b.date}`)}
          >
            <div className="font-semibold">{b.title}</div>
            <div className="text-sm text-gray-500">{b.date}</div>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">주보 등록</h3>
            <form className="space-y-2">
              <input type="date" className="w-full border px-3 py-2 rounded" />
              <input
                type="text"
                placeholder="주보 제목"
                className="w-full border px-3 py-2 rounded"
              />
              <input type="file" className="w-full" />
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
