import { redirect } from "next/navigation"
import { getSession, checkSessionActivity } from "@/app/actions/auth-actions"

export default async function SuperAdminDashboardPage() {
  // Check session activity
  const isActive = await checkSessionActivity()
  if (!isActive) {
    redirect("/?session=expired")
  }

  const session = await getSession()

  // If no session, redirect to login
  if (!session) {
    redirect("/login?sessionExpired=true")
  }

  // If not a super admin, redirect to appropriate dashboard
  if (session.role !== "super_admin") {
    switch (session.role) {
      case "admin":
        redirect("/admin/dashboard")
      case "instructor":
        redirect("/instructor/dashboard")
      case "student":
        redirect("/student/dashboard")
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Super Admin Dashboard</h1>
      <p className="mb-4">Welcome, {session.name || session.email}!</p>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">System Management</h2>
        <p className="text-gray-500">Manage system settings and configurations.</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Admin Management</h2>
        <p className="text-gray-500">Manage admin users and permissions.</p>
      </div>

      <form action="/api/auth/signout" method="post">
        <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded">
          Sign Out
        </button>
      </form>
    </div>
  )
}

