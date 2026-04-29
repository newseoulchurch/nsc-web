"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

type HomeVideoConfig = {
  videoUrl: string;
  titleLine1: string;
  titleLine2?: string;
  watchUrl?: string;
  updatedAt: string;
};

export default function HomeVideoForm() {
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [currentConfig, setCurrentConfig] = useState<HomeVideoConfig | null>(
    null,
  );
  const [titleLine1, setTitleLine1] = useState("");
  const [titleLine2, setTitleLine2] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [watchUrl, setWatchUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);
  const [compressedFileSize, setCompressedFileSize] = useState<number | null>(
    null,
  );

  const loadFFmpeg = async (): Promise<FFmpeg> => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const makeCompressedFileName = (name: string) => {
    const baseName = name.replace(/\.[^/.]+$/, "");
    return `${baseName}-compressed-10s.mp4`;
  };

  const compressVideo = async (file: File): Promise<File> => {
    const ffmpeg = await loadFFmpeg();
    setCompressProgress(0);

    const MAX_DURATION = 10; // 앞 10초만 사용
    const TARGET_SIZE_MB = 1.5;
    const TARGET_SIZE_KB = TARGET_SIZE_MB * 1024;

    // 컨테이너 오버헤드와 인코딩 오차를 고려해 약간 낮게 설정
    const SAFE_TARGET_KB = TARGET_SIZE_KB * 0.9;

    // 10초 기준 목표 bitrate
    const targetBitrateKbps = Math.max(
      100,
      Math.floor((SAFE_TARGET_KB * 8) / MAX_DURATION),
    );

    const onLog = ({ message }: { message: string }) => {
      const match = message.match(/time=(\d{2}):(\d{2}):(\d{2}\.?\d*)/);

      if (match) {
        const time =
          parseInt(match[1]) * 3600 +
          parseInt(match[2]) * 60 +
          parseFloat(match[3]);

        const pct = Math.round(Math.min((time / MAX_DURATION) * 100, 99));
        setCompressProgress(pct);
      }
    };

    ffmpeg.on("log", onLog);

    try {
      await ffmpeg.writeFile("input", await fetchFile(file));

      await ffmpeg.exec([
        "-i",
        "input",

        // 앞 10초만 사용
        "-t",
        String(MAX_DURATION),

        // 비디오 압축
        "-c:v",
        "libx264",
        "-b:v",
        `${targetBitrateKbps}k`,
        "-maxrate",
        `${targetBitrateKbps}k`,
        "-bufsize",
        `${targetBitrateKbps * 2}k`,

        // 웹 메인 루프 영상용 설정
        "-preset",
        "veryfast",
        "-vf",
        "scale='min(854,iw)':-2,fps=24",

        // 오디오 제거
        "-an",

        // 웹 재생 최적화
        "-movflags",
        "+faststart",

        "output.mp4",
      ]);

      setCompressProgress(100);

      const data = await ffmpeg.readFile("output.mp4");
      const outputBlob = new Blob([data], { type: "video/mp4" });

      return new File([outputBlob], makeCompressedFileName(file.name), {
        type: "video/mp4",
      });
    } finally {
      ffmpeg.off("log", onLog);

      // ffmpeg 메모리 파일 정리
      try {
        await ffmpeg.deleteFile("input");
        await ffmpeg.deleteFile("output.mp4");
      } catch {
        // cleanup 실패는 무시
      }
    }
  };

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    setMessage(null);
    setSelectedFile(file);
    setCompressedFile(null);
    setOriginalFileSize(file?.size ?? null);
    setCompressedFileSize(null);
    setCompressProgress(0);

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setMessage("비디오 파일만 업로드할 수 있습니다.");
      return;
    }

    setIsCompressing(true);

    try {
      const result = await compressVideo(file);

      setCompressedFile(result);
      setCompressedFileSize(result.size);

      if (result.size > 1.5 * 1024 * 1024) {
        setMessage(
          `앞 10초로 잘라 압축했지만 1.5MB를 초과했습니다. 현재 용량: ${(result.size / 1024 / 1024).toFixed(2)}MB`,
        );
      } else {
        setMessage(
          `앞 10초 영상으로 압축 완료되었습니다. 압축 후 용량: ${(result.size / 1024 / 1024).toFixed(2)}MB`,
        );
      }
    } catch (err) {
      console.error("Compression failed:", err);
      setMessage("영상 압축 중 오류가 발생했습니다.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const file =
      compressedFile ?? selectedFile ?? inputFileRef.current?.files?.[0];

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
        const uploadFile = file;

        const blob: PutBlobResult = await upload(uploadFile.name, uploadFile, {
          access: "public",
          handleUploadUrl: "/api/home-video/upload",
          multipart: true,
          clientPayload: "home-main-video",
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
          onChange={handleFileChange}
        />
        {originalFileSize && (
          <p className="text-xs text-gray-500">
            원본 용량: {(originalFileSize / 1024 / 1024).toFixed(2)}MB
          </p>
        )}

        {compressedFileSize && (
          <p className="text-xs text-gray-500">
            압축 후 용량: {(compressedFileSize / 1024 / 1024).toFixed(2)}MB
          </p>
        )}

        {compressedFile && (
          <p className="text-xs text-gray-500">
            업로드 대상: 앞 10초로 잘린 압축 영상
          </p>
        )}
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
        disabled={isSaving || isCompressing}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
      >
        {isCompressing
          ? `압축 중... ${compressProgress}%`
          : isSaving
            ? "저장 중..."
            : "저장"}
      </button>

      {isCompressing && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${compressProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            브라우저에서 영상을 압축하는 중입니다. 잠시만 기다려 주세요.
          </p>
        </div>
      )}

      {isSaving && !isCompressing && (
        <p className="text-xs text-gray-500">Vercel에 업로드 중...</p>
      )}

      {message && <p className="text-sm mt-2">{message}</p>}
    </form>
  );
}
