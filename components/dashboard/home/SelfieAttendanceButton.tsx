"use client";
import React, { useState } from "react";
import { Camera } from "lucide-react";
import { useCustomColors } from "@/lib/use-custom-colors";
import { Badge } from "@/components/dashboard/ui/badge";
import { useRouter } from "next/navigation";

interface SelfieAttendanceButtonProps {
  className?: string;
}

export function SelfieAttendanceButton({ className = "" }: SelfieAttendanceButtonProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  
  const handleClick = () => {
    // Navigate to instructor page with attendance tab
    router.push('/dashboard/user/staff/instructor?tab=attendance');
  };

  return (
    <div className={`${className} relative`}>
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        className="group relative w-full overflow-hidden rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_50px_rgba(0,0,0,0.2)] transition-all duration-500 transform hover:scale-105 hover:-translate-y-1"
        style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ backgroundImage: `linear-gradient(225deg, ${primaryColor}, ${secondaryColor})` }}
        />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
        <div className="absolute -top-1 -right-1 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute -bottom-1 -left-1 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />

        <div className="relative z-10 flex items-center gap-3 px-6 py-4">
          <div className="relative">
            <div className={`p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg transition-all duration-300 ${isHovered ? "rotate-12 scale-110" : ""}`}>
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="text-left flex-1">
            <div className="text-base font-bold text-white flex items-center gap-2">
              Selfie Attendance
            </div>
            <div className="text-xs text-white/90 font-medium">
              Mark your attendance with a selfie
            </div>
          </div>

          <Badge 
            className="bg-white/90 backdrop-blur-sm text-xs font-bold shadow-lg"
            style={{ color: primaryColor }}
          >
            Try Now
          </Badge>
        </div>
      </button>
    </div>
  );
}
