import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const date = formData.get("date");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    if (file.size > 500 * 1024) {
      return NextResponse.json(
        {
          error: `파일 용량이 500KB를 초과했습니다. 현재 용량: ${Math.round(
            file.size / 1024,
          )}KB`,
        },
        { status: 400 },
      );
    }

    const safeDate =
      typeof date === "string" && date.trim() !== ""
        ? date.replace(/[^0-9-]/g, "")
        : "no-date";

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const blob = await put(
      `events/${safeDate}/${Date.now()}-${safeFileName}`,
      file,
      {
        access: "public",
        addRandomSuffix: false,
      },
    );

    return NextResponse.json({
      url: blob.url,
    });
  } catch (error) {
    console.error("events-upload error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "이미지 업로드에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
