// d:\UB\app\student\dashboard\page.tsx

import { redirect } from "next/navigation";
// Removed checkSessionActivity import as it cannot modify cookies here.
// Middleware should handle session activity checks and redirects before this page renders.
import { getSession } from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button"; // Assuming you might want Shadcn buttons

export default async function StudentDashboardPage() {
  // Session and activity checks are now primarily handled by middleware.
  // The middleware will redirect unauthenticated or inactive users *before*
  // this page component renders.

  const session = await getSession();

  // If no session exists (e.g., middleware failed or edge case), redirect to login.
  // This is mostly a defensive check; middleware should handle the primary redirection.
  if (!session) {
    // Redirect with a query param to potentially show a message on the login page
    redirect("/login?sessionExpired=true");
    // Return null to stop rendering this component after redirecting
    return null;
  }

  // Ensure the user has the correct role for this dashboard.
  if (session.role !== "student") {
    // Redirect users with other roles to their respective dashboards.
    switch (session.role) {
      case "admin":
        redirect("/admin/dashboard");
        break; // Added break statement
      case "super_admin":
        redirect("/super-admin/dashboard");
        break; // Added break statement
      case "instructor":
        redirect("/instructor/dashboard");
        break; // Added break statement
      default:
        // Optional: Handle unexpected roles, maybe redirect to login or a generic error page
        console.warn(`Unexpected user role found in student dashboard: ${session.role}`);
        redirect("/login"); // Redirect to login as a fallback
        break; // Added break statement
    }
    // Return null after redirecting
    return null;
  }

  // If session exists and role is student, render the dashboard content.
  return (
    <div className="p-6 bg-gray-50 min-h-screen"> {/* Added some basic styling */}
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Student Dashboard</h1>
      <p className="mb-6 text-lg text-gray-600">
        Welcome back, <span className="font-semibold">{session.name || session.email}</span>!
      </p>

      {/* Example Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3 text-purple-700">Your Courses</h2>
          {/* TODO: Replace with actual course data fetching and rendering */}
          <p className="text-gray-500">You are not enrolled in any courses yet.</p>
          {/* Example link */}
          {/* <a href="/courses" className="text-purple-600 hover:underline mt-2 inline-block">Browse Courses</a> */}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3 text-orange-500">Upcoming Classes</h2>
          {/* TODO: Replace with actual class schedule data */}
          <p className="text-gray-500">No upcoming classes scheduled.</p>
          {/* Example link */}
          {/* <a href="/schedule" className="text-orange-600 hover:underline mt-2 inline-block">View Full Schedule</a> */}
        </div>
      </div>

      {/* Add more dashboard sections as needed */}
      {/*
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">Recent Activity</h2>
        <p className="text-gray-500">No recent activity.</p>
      </div>
      */}

      {/* Sign Out Button - Using a form POST to the signout API route */}
      <form action="/login" method="post" className="mt-8">
        <Button
          type="submit"
          variant="destructive" // Use Shadcn destructive variant for sign out
          className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
        >
          Sign Out
        </Button>
      </form>
    </div>
  );
}
