import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { id, password } = await req.json()

  if (id === "admin" && password === "1234") {
    const response = NextResponse.json({ success: true })

    response.cookies.set("adminToken", "mock-admin-token", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60,
    })

    return response
  }

  return new NextResponse("Unauthorized", { status: 401 })
}
