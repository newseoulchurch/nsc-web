"use client";

import { useEffect, useState } from "react";

type HomeVideoConfig = {
  videoUrl: string; // 홈 배경용 YouTube URL
  titleLine1: string;
  titleLine2?: string;
  watchUrl?: string; // WATCH 버튼용 YouTube URL
  updatedAt: string;
};

export default function HomeVideoForm() {
  const [currentConfig, setCurrentConfig] = useState<HomeVideoConfig | null>(
    null,
  );
  const [videoUrl, setVideoUrl] = useState("");
  const [titleLine1, setTitleLine1] = useState("");
  const [titleLine2, setTitleLine2] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/home-video", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();

        if (data) {
          setCurrentConfig(data);
          setVideoUrl(data.videoUrl ?? "");
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

    if (!videoUrl.trim()) {
      setMessage("홈 배경용 YouTube URL을 입력해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      const metaRes = await fetch("/api/home-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          titleLine1: titleLine1.trim(),
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
        <label className="block font-semibold">홈 배경용 YouTube URL</label>
        <input
          type="url"
          className="w-full border rounded px-3 py-2"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="예: https://www.youtube.com/shorts/VIDEO_ID"
        />
        <p className="text-xs text-gray-500">
          홈 메인 배경에서 무한 반복될 영상입니다. 일부공개 YouTube URL도
          가능합니다.
        </p>
      </div>

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
          WORD IS LIFE 버튼을 눌렀을 때 이동할 YouTube URL입니다.
        </p>
      </div>

      {currentConfig?.videoUrl && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            현재 적용 중인 배경 YouTube URL
          </p>
          <a
            href={currentConfig.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline break-all"
          >
            {currentConfig.videoUrl}
          </a>
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
