"use client"

import { Badge } from "@/components/dashboard/ui/badge"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Calendar, Clock, User, MapPin, Pencil, Trash2, NotepadText, BookOpen } from "lucide-react"

interface StudentAttendanceRecord {
  id: number;
  studentId: string;
  studentName: string;
  cohortId?: string;
  cohortName?: string;
  cohortInstructor?: string;
  cohortTiming?: string;
  courseId?: string;
  courseName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: 'present' | 'absent' | string;
  notes?: string;
}

interface AttendanceGridProps {
  attendanceData: StudentAttendanceRecord[];
  onSelectRecord?: (record: StudentAttendanceRecord) => void;
  onEditRecord?: (record: StudentAttendanceRecord) => void;
  onDeleteRecord?: (record: StudentAttendanceRecord) => void;
}

export function AttendanceGrid({ 
  attendanceData, 
  onSelectRecord, 
  onEditRecord,
  onDeleteRecord
}: AttendanceGridProps) {
  const needsHorizontalScroll = attendanceData.length > 3; // show horizontal scroll & indicator only if more than 3 records
  return (
    <div className={needsHorizontalScroll ? "overflow-x-auto" : ""}>
      <div
        className={needsHorizontalScroll ? "flex gap-4 pb-4 px-4" : "flex flex-wrap gap-4 pb-4 px-4"}
        style={needsHorizontalScroll ? { minWidth: 'max-content' } : undefined}
      >
      {attendanceData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-purple-50/40 rounded-xl border border-dashed border-purple-300 min-w-[320px] w-[320px]">
          <Calendar className="h-16 w-16 mb-4 text-purple-300" />
          <p className="text-lg font-medium text-purple-700">No attendance records found</p>
          <p className="text-sm text-purple-600">Try adjusting your search or filters or add a new record.</p>
        </div>
      ) : (
        attendanceData.map((record) => (
          <Card 
            key={record.id} 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border-2 border-orange-400 hover:border-orange-500 relative rounded-xl overflow-hidden flex-shrink-0" 
            style={{ width: '280px', minWidth: '280px' }}
            onClick={() => onSelectRecord?.(record)}
          >
            <CardContent className="p-4">
              {/* Edit Button (top-right) */}
              {onEditRecord && (
                <button
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 hover:bg-gray-100 transition-colors shadow-sm"
                  onClick={(e) => { e.stopPropagation(); onEditRecord?.(record); }}
                  aria-label="Edit attendance"
                >
                  <Pencil className="h-4 w-4 text-purple-600" />
                </button>
              )}

              <div className="flex items-start justify-between mb-3 pr-8">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {record.studentName}
                  </h3>
                  <p className="text-sm text-gray-500">{record.studentId}</p>
                </div>
                <Badge className={
                  record.status === "present"
                    ? "bg-green-100 text-green-800"
                    : record.status === 'planned'
                      ? 'bg-amber-100 text-amber-800'
                      : "bg-red-100 text-red-800"
                }>
                  {(() => {
                    const s = (record.status || '').toLowerCase();
                    if (s === 'planned') return 'Planned leave'
                    if (s === 'absent') return 'Unplanned Leave'
                    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '-'
                  })()}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {record.date ? new Date(record.date).toLocaleDateString('en-GB') : '-'}
                </div>

                {(record.startTime || record.endTime) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    {record.startTime || '-'} - {record.endTime || '-'}
                  </div>
                )}

                {/* Removed Course Name/ID and Cohort Name/ID display per requirement */}

                {(record.cohortInstructor || record.cohortTiming) && (
                  <div className="flex items-start text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {record.cohortInstructor && (
                        <p className="text-xs text-gray-500 truncate">
                          {record.cohortInstructor}
                        </p>
                      )}
                      {record.cohortTiming && (
                        <p className="text-xs text-gray-500 truncate">
                          {record.cohortTiming}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {record.notes && (
                  <div className="flex items-start text-sm text-gray-600">
                    <NotepadText className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                    <p className="text-xs text-gray-600 line-clamp-2" title={record.notes}>
                      {record.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Delete Button (bottom-right) */}
              {onDeleteRecord && (
                <div className="absolute bottom-3 right-3">
                  <button
                    className="p-1.5 rounded-full bg-white/90 hover:bg-red-50 transition-colors shadow-sm"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onDeleteRecord?.(record);
                    }}
                    aria-label="Delete attendance"
                    title="Delete attendance"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
      </div>
    </div>
  );
}
