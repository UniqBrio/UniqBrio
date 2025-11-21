
"use client";

import { useRouter } from "next/navigation";

export default function SelectRolePage() {
  const router = useRouter();

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