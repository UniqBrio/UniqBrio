import { redirect } from "next/navigation"
import { getSession, checkSessionActivity } from "@/app/actions/auth-actions"

export const metadata = {
  title: "Admin Dashboard | UniqBrio",
  description: "Manage users, roles, and course content.",
}

export default async function AdminDashboardPage() {
  const isActive = await checkSessionActivity()
  if (!isActive) {
    redirect("/?session=expired")
  }

  const session = await getSession()

  // If no session or role isn't admin, redirect appropriately
  if (!session || session.role !== "admin") {
    switch (session?.role) {
      case "super_admin":
        redirect("/super-admin/dashboard")
        break
      case "instructor":
        redirect("/instructor/dashboard")
        break
      case "student":
        redirect("/student/dashboard")
        break
      default:
        redirect("/login?unauthorized=true")
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-4">Welcome, {session.name || session.email}!</p>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">User Management</h2>
        <p className="text-gray-500">Manage users, roles, and permissions.</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Course Management</h2>
        <p className="text-gray-500">Create and manage courses and classes.</p>
      </div>

      {/* Sign out button */}
      <form action="/api/auth/signout" method="post">
        <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded">
          Sign Out
        </button>
      </form>
    </div>
  )
}
