// app/admin/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("adminToken")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold">Welcome, Admin</h1>
      <div className="space-x-4">
        <a href="/admin/events" className="underline text-blue-500">
          이벤트 관리
        </a>
        <a href="/admin/weekly-paper" className="underline text-blue-500">
          주보 관리
        </a>
        <a href="/admin/home-video" className="underline text-blue-500">
          홈 화면 영상 설정
        </a>
      </div>
    </div>
  );
}
