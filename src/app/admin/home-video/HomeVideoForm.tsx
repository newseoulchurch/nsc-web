"use client";

import { useEffect, useRef, useState } from "react";
import { upload, type PutBlobResult } from "@vercel/blob/client";

type HomeVideoConfig = {
  videoUrl: string;
  titleLine1: string;
  titleLine2?: string;
  watchUrl?: string;
  updatedAt: string;
};

export default function HomeVideoForm() {
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [currentConfig, setCurrentConfig] = useState<HomeVideoConfig | null>(
    null
  );
  const [titleLine1, setTitleLine1] = useState("");
  const [titleLine2, setTitleLine2] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [watchUrl, setWatchUrl] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/home-video", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data) {
          setCurrentConfig(data);
          setTitleLine1(data.titleLine1 ?? "");
          setTitleLine2(data.titleLine2 ?? "");
          setWatchUrl(data.watchUrl ?? "");
        }
      } catch (err) {
        console.error("Failed to load home video config:", err);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const file = inputFileRef.current?.files?.[0];

    // 🔹 완전 첫 저장(기존 영상 없음)인데 파일도 없으면 에러
    if (!file && !currentConfig?.videoUrl) {
      setMessage("영상을 선택해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      // 🔹 기본값: 기존 영상 URL
      let finalVideoUrl = currentConfig?.videoUrl ?? "";

      // 🔹 새 파일이 있을 때만 Blob 업로드
      if (file) {
        const blob: PutBlobResult = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/home-video/upload",
          multipart: true,
          clientPayload: "home-main-video",
          // addRandomSuffix: true,
        });

        finalVideoUrl = blob.url;
      }

      const metaRes = await fetch("/api/home-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: finalVideoUrl,
          titleLine1: titleLine1.trim(), // 비어 있어도 그대로 전송
          titleLine2: titleLine2.trim(),
          watchUrl: watchUrl.trim(),
        }),
      });

      if (!metaRes.ok) {
        const errData = await metaRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save home video metadata");
      }

      const saved = (await metaRes.json()) as HomeVideoConfig;
      setCurrentConfig(saved);
      setMessage("저장되었습니다.");

      if (inputFileRef.current) {
        inputFileRef.current.value = "";
      }
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <label className="block font-semibold">메인 제목 (첫 줄, 선택)</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={titleLine1}
          onChange={(e) => setTitleLine1(e.target.value)}
          placeholder="예: [SERMON] GOD'S KINGDOM"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">설교자 (둘째 줄, 선택)</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={titleLine2}
          onChange={(e) => setTitleLine2(e.target.value)}
          placeholder="예: PASTOR JOE OH"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">WATCH 버튼 YouTube URL</label>
        <input
          type="url"
          className="w-full border rounded px-3 py-2"
          value={watchUrl}
          onChange={(e) => setWatchUrl(e.target.value)}
          placeholder="예: https://www.youtube.com/watch?v=..."
        />
        <p className="text-xs text-gray-500">
          비워두면 기본 채널 주소(https://www.youtube.com/@newseoulchurch)를
          사용합니다.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block font-semibold">홈 영상 파일 (mp4 / webm)</label>
        <input
          ref={inputFileRef}
          type="file"
          accept="video/mp4,video/webm"
          className="w-full"
          required={!currentConfig?.videoUrl}
        />
      </div>

      {currentConfig?.videoUrl && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            현재 적용 중인 영상 (미리보기)
          </p>
          <video
            src={currentConfig.videoUrl}
            controls
            className="w-full max-h-64 border rounded"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
      >
        {isSaving ? "저장 중..." : "저장"}
      </button>

      {message && <p className="text-sm mt-2">{message}</p>}
    </form>
  );
}
