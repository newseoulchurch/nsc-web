import { list } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  console.log("[events-upload] file:", file);
  if (!file) {
    console.log("[events-upload] Missing file or date");

    return NextResponse.json({ error: "파일 또는 날짜 없음" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `events/${uniqueSuffix}.${ext}`;

  const { url } = await put(fileName, file, {
    access: "public",
  });
  console.log("[events-upload] Uploaded file:", url);

  return NextResponse.json({
    url,
    pathname: fileName,
    uploadedAt: new Date().toISOString(),
  });
}

export async function GET() {
  const { blobs } = await list({ prefix: "events/" });

  const results = blobs.map((blob) => {
    return {
      url: blob.url,
      pathname: blob.pathname,
      uploadedAt: blob.uploadedAt,
    };
  });

  return NextResponse.json(results);
}
