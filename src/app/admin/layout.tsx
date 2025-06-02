// app/admin/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = cookies(); // await 필요 없음
  const token = cookieStore.get("adminToken")?.value;
  console.log("//token", token);
  if (!token) {
    redirect("/login");
  }

  return <>{children}</>;
}
