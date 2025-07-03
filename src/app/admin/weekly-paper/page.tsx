"use client";

import { useEffect, useState } from "react";

export type WeeklyImage = {
  url: string;
  pathname: string;
  uploadedAt: string;
};

export default function WeeklyPaperPage() {
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<WeeklyImage[]>([]);
  const [visibleImages, setVisibleImages] = useState<Record<string, boolean>>(
    {}
  );

  const toggleImage = (key: string) => {
    setVisibleImages((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || files.length === 0) {
      alert("날짜와 파일을 모두 입력해주세요.");
      return;
    }

    setUploading(true);

    const newImages: WeeklyImage[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("date", date);

      const res = await fetch("/api/weekly-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      // 예상되는 응답: { url, pathname, uploadedAt }
      newImages.push({
        url: data.url,
        pathname: data.url.split("/").pop(), // 또는 서버에서 명시적으로 반환
        uploadedAt: new Date().toISOString(), // or data.uploadedAt
      });
    }

    setImages((prev) => [...newImages, ...prev]); // 최신순 정렬을 원하면 앞에 추가
    setUploading(false);
    setShowModal(false);
    setFiles([]);
  };

  useEffect(() => {
    fetch("/api/weekly-upload")
      .then((res) => res.json())
      .then((data) =>
        setImages(data.filter((item) => item.date !== "unknown"))
      );
  }, []);
  console.log("//data", images);
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
        {images.map((img) => (
          <li
            key={img.pathname}
            className="border rounded shadow cursor-pointer"
            onClick={() => toggleImage(img.pathname)}
          >
            <div className="p-2 text-sm text-gray-800 font-medium">
              {img.pathname}
            </div>

            {/* 클릭 시에만 이미지 보이기 */}
            {visibleImages[img.pathname] && (
              <img
                src={img.url}
                alt={img.pathname}
                className="w-full h-auto rounded-b"
              />
            )}
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">주보 등록</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full"
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
                  disabled={uploading}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  {uploading ? "업로드 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
