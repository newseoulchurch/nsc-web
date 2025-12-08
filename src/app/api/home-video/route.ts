// app/api/home-video/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { fireStore } from "@/lib/firebase";
import { del } from "@vercel/blob";

type HomeVideoConfig = {
  videoUrl: string;
  titleLine1: string;
  titleLine2?: string;
  updatedAt: string;
  watchUrl?: string;
};

const DOC_REF = doc(fireStore, "settings", "homeVideo");

// GET: 홈 화면에서 사용하는 공개 API
export async function GET() {
  try {
    const snap = await getDoc(DOC_REF);

    if (!snap.exists()) {
      return NextResponse.json(null, { status: 200 });
    }

    const data = snap.data() as HomeVideoConfig;
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("GET /api/home-video error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST: 관리자에서 설정 저장 (이전 영상 삭제 포함)
export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get("adminToken")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      videoUrl: string;
      titleLine1: string;
      titleLine2?: string;
      watchUrl?: string;
    };

    if (!body.videoUrl || !body.titleLine1) {
      return NextResponse.json(
        { error: "videoUrl and titleLine1 required" },
        { status: 400 }
      );
    }

    const snap = await getDoc(DOC_REF);
    const prev = snap.exists() ? (snap.data() as HomeVideoConfig) : null;

    if (prev?.videoUrl && prev.videoUrl !== body.videoUrl) {
      try {
        await del(prev.videoUrl);
      } catch (delErr) {
        console.warn("previous blob delete failed:", delErr);
      }
    }

    const newConfig: HomeVideoConfig = {
      videoUrl: body.videoUrl,
      titleLine1: body.titleLine1,
      titleLine2: body.titleLine2 ?? "",
      watchUrl: body.watchUrl ?? "",
      updatedAt: new Date().toISOString(),
    };

    await setDoc(DOC_REF, newConfig);

    return NextResponse.json(newConfig, { status: 200 });
  } catch (err) {
    console.error("POST /api/home-video error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
