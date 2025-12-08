// app/admin/home-video/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HomeVideoForm from "./HomeVideoForm";

export default async function AdminHomeVideoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("adminToken")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="p-10 space-y-6">
      <h1 className="text-2xl font-bold">홈 화면 영상 설정</h1>
      <HomeVideoForm />
    </div>
  );
}
