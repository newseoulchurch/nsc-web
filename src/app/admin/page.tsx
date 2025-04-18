import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("adminToken")?.value

  if (!token) {
    redirect("/login")
  }

  return (
    <div className="p-10">
      <h1 className="text-xl font-bold">Welcome, Admin</h1>
    </div>
  )
}
