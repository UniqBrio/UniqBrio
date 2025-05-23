import { redirect } from "next/navigation"
import { getSession, checkSessionActivity } from "@/app/actions/auth-actions"

export default async function InstructorDashboardPage() {
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

  // If not an instructor, redirect to appropriate dashboard
  if (session.role !== "instructor") {
    switch (session.role) {
      case "admin":
        redirect("/admin/dashboard")
      case "super_admin":
        redirect("/super-admin/dashboard")
      case "student":
        redirect("/student/dashboard")
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Instructor Dashboard</h1>
      <p className="mb-4">Welcome, {session.name || session.email}!</p>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Your Classes</h2>
        <p className="text-gray-500">You are not teaching any classes yet.</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Student Roster</h2>
        <p className="text-gray-500">No students enrolled in your classes.</p>
      </div>

      <form action="/api/auth/signout" method="post">
        <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded">
          Sign Out
        </button>
      </form>
    </div>
  )
}

