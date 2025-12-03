
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function SelectRolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Check for OAuth errors in URL params
    const error = searchParams?.get('error');
    
    if (error) {
      console.log("[SelectRolePage] OAuth error detected:", error);
      // Redirect to login with error parameter
      router.replace(`/login?error=${error}`);
      return;
    }

    // If not loading and no session, redirect to login
    if (status === "unauthenticated") {
      console.log("[SelectRolePage] No session found, redirecting to login");
      router.replace("/login");
      return;
    }

    // If authenticated, user can select role
    if (status === "authenticated") {
      console.log("[SelectRolePage] User authenticated:", session?.user?.email);
    }
  }, [status, searchParams, router, session]);

  const handleRoleSelection = (role: string) => {
    // Redirect based on the selected role
    switch (role) {
      case "super_admin":
        router.push("/dashboard"); // Super admin uses main dashboard
        break;
      case "admin":
        router.push("/admin/dashboard");
        break;
      case "instructor":
        router.push("/instructor/dashboard");
        break;
      case "student":
        router.push("/student/dashboard");
        break;
      default:
        console.error("Invalid role selected");
    }
  };

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="animate-spin h-8 w-8 text-gray-600" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  // Don't render role selection if not authenticated
  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Select Your Role</h1>
      <div className="space-y-4">
        <button
          onClick={() => handleRoleSelection("super_admin")}
          className="py-2 px-6 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Super Admin
        </button>
        <button
          onClick={() => handleRoleSelection("admin")}
          className="py-2 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Admin
        </button>
        <button
          onClick={() => handleRoleSelection("instructor")}
          className="py-2 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Instructor
        </button>
        <button
          onClick={() => handleRoleSelection("student")}
          className="py-2 px-6 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
        >
          Student
        </button>
      </div>
    </div>
  );
}