import { getEdgeConfigCredentials } from "@/lib/edge-config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { id, password } = await req.json();
  const { edgeConfigId, token } = getEdgeConfigCredentials();

  if (!edgeConfigId || !token) {
    return NextResponse.json(
      { error: "Could not extract Edge Config credentials" },
      { status: 500 }
    );
  }

  // ✅ GET으로 변경 – 특정 key "login" 조회
  const res = await fetch(
    `https://edge-config.vercel.com/${edgeConfigId}/item/login`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await res.json();

  if (!res.ok) {
    let errorMessage = "Unknown error";
    try {
      const error = await res.json();
      errorMessage = error?.message || error;
    } catch {
      errorMessage = `Status ${res.status}`;
    }

    return NextResponse.json(
      { error: "Failed to fetch login credentials", details: errorMessage },
      { status: 500 }
    );
  }

  const loginData = data;

  // ✅ 사용자 입력 정보와 비교
  if (loginData.id === id && loginData.pw === password) {
    const response = NextResponse.json({ success: true });

    response.cookies.set("adminToken", "mock-admin-token", {
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  }

  return new NextResponse("Unauthorized", { status: 401 });
}
