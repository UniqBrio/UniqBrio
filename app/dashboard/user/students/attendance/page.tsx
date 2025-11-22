"use client"

export const dynamic = 'force-dynamic'
import { useEffect, useState } from "react"
import { AttendanceManagement } from "@/components/dashboard/student/attendance/attendance-management"

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  useEffect(() => {
    // Load attendance data immediately when component mounts
    const loadAttendanceData = async () => {
      try {
        const response = await fetch('/api/dashboard/student/attendance');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Map MongoDB _id to id for frontend compatibility
            const mappedData = result.data.map((record: any) => ({
              ...record,
              id: record._id
            }));
            setAttendanceData(mappedData);
          }
        }
      } catch (error) {
        console.error('Error loading attendance data:', error);
      } finally {
        setAttendanceLoading(false);
      }
    };
    
    loadAttendanceData();
  }, []);

  return (
    <AttendanceManagement 
        preloadedData={attendanceData}
        preloadedDataLoading={attendanceLoading}
      />)
}
