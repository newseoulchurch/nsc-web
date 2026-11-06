import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export function adminDb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies();
  return store.get("adminToken")?.value ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function badRequest(error: unknown) {
  return NextResponse.json(
    typeof error === "string" ? { error } : { error: "Invalid input", issues: error },
    { status: 400 },
  );
}

export const isOurBlob = (url: string | null | undefined): url is string =>
  !!url && url.includes(".blob.vercel-storage.com/");
