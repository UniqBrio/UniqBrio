import { redirect } from "next/navigation";
import { getSession } from "../actions/auth-actions";
import { logout } from "../actions/auth-actions";

export default async function ProfilePage() {
  const session = await getSession();

  // If no session, redirect to login
  if (!session) {
    redirect("/login?sessionExpired=true");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#fd9c2d]">Your Profile</h1>
        <p className="text-[#978e8e] mt-2">Welcome back, {session.email}!</p>
      </div>

      <div className="bg-[#d9d9d9] p-6 rounded-lg">
        <h2 className="text-xl font-medium text-[#39006f] mb-4">Account Information</h2>
        <div className="space-y-2">
          <p><span className="font-medium">Email:</span> {session.email}</p>
          <p><span className="font-medium">Account Type:</span> {session.role}</p>
          <p><span className="font-medium">Verified:</span> {session.verified ? "Yes" : "No"}</p>
        </div>
      </div>

      <form action={logout}>
        <button type="submit" className="auth-button">
          Logout
        </button>
      </form>
    </div>
  );
}
