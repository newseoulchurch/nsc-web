import { list } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const date = formData.get("date") as string;

  if (!file || !date) {
    return NextResponse.json({ error: "파일 또는 날짜 없음" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `weekly-paper/${date}_${uniqueSuffix}.${ext}`;

  const { url } = await put(fileName, file, {
    access: "public",
  });

  return NextResponse.json({
    url,
    pathname: fileName,
    uploadedAt: new Date().toISOString(),
    date,
  });
}

export async function GET() {
  const { blobs } = await list({ prefix: "weekly-paper/" });

  const results = blobs.map((blob) => {
    const match = blob.pathname.match(/weekly-paper\/(\d{4}-\d{2}-\d{2})_/);
    const date = match?.[1] ?? "unknown";

    return {
      url: blob.url,
      pathname: blob.pathname,
      uploadedAt: blob.uploadedAt,
      date,
    };
  });

  return NextResponse.json(results);
}
