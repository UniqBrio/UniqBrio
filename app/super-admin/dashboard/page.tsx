// d:\UB\app\super-admin\dashboard\page.tsx

import { redirect } from "next/navigation";
// --- REMOVE this import ---
// import { checkSessionActivity } from "@/app/actions/auth-actions";
import { getSession } from "@/app/actions/auth-actions"; // Keep getSession

export default async function SuperAdminDashboardPage() {
  // --- REMOVE this block ---
  // // Check session activity
  // const isActive = await checkSessionActivity();
  // if (!isActive) {
  //   // Middleware should handle this redirect
  //   redirect("/?session=expired");
  //   return null; // Add return null after redirect
  // }
  // --- END REMOVAL ---

  const session = await getSession();

  // If no session, redirect to login (Middleware should handle this primarily)
  if (!session) {
    redirect("/login?sessionExpired=true");
    return null; // Add return null after redirect
  }

  // If not a super admin, redirect to appropriate dashboard
  if (session.role !== "super_admin") {
    switch (session.role) {
      case "admin":
        redirect("/admin/dashboard");
        break; // Add break statement
      case "instructor":
        redirect("/instructor/dashboard");
        break; // Add break statement
      case "student":
        redirect("/student/dashboard");
        break; // Add break statement
      default:
        // Handle unexpected roles
        console.warn(`Unexpected user role found in super-admin dashboard: ${session.role}`);
        redirect("/login"); // Fallback redirect
        break; // Add break statement
    }
    return null; // Add return null after redirect
  }

  // Render dashboard content if session exists and role is correct
  return (
    <div className="p-6 bg-gray-50 min-h-screen"> {/* Optional: Added styling */}
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Super Admin Dashboard</h1>
      <p className="mb-6 text-lg text-gray-600">
        Welcome, <span className="font-semibold">{session.name || session.email}</span>!
      </p>

      <div className="bg-white p-6 rounded-lg shadow mb-6"> {/* Optional: Added styling */}
        <h2 className="text-xl font-semibold mb-3 text-purple-700">System Management</h2>
        <p className="text-gray-500">Manage system settings and configurations.</p>
        {/* TODO: Add actual management links/components */}
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6"> {/* Optional: Added styling */}
        <h2 className="text-xl font-semibold mb-3 text-orange-500">Admin Management</h2>
        <p className="text-gray-500">Manage admin users and permissions.</p>
        {/* TODO: Add actual management links/components */}
      </div>

      {/* Sign Out Button */}
      <form action="/api/auth/signout" method="post" className="mt-8">
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}
