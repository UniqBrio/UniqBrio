"use client"

import { Badge } from "@/components/dashboard/ui/badge"
import { Card, CardContent } from "@/components/dashboard/ui/card"
import { Calendar, Clock, User, MapPin, Pencil, Trash2, NotepadText, BookOpen } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors"

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
  const { primaryColor, secondaryColor } = useCustomColors();
  const needsHorizontalScroll = attendanceData.length > 3; // show horizontal scroll & indicator only if more than 3 records
  return (
    <div className={needsHorizontalScroll ? "overflow-x-auto" : ""}>
      <div
        className={needsHorizontalScroll ? "flex gap-4 pb-4 px-4" : "flex flex-wrap gap-4 pb-4 px-4"}
        style={needsHorizontalScroll ? { minWidth: 'max-content' } : undefined}
      >
      {attendanceData.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-white rounded-xl border border-dashed min-w-[320px] w-[320px]"
          style={{ borderColor: `${primaryColor}55`, background: `color-mix(in oklab, ${primaryColor} 6%, white)` }}
        >
          <Calendar className="h-16 w-16 mb-4" style={{ color: `${primaryColor}66` }} />
          <p className="text-lg font-medium" style={{ color: primaryColor }}>No attendance records found</p>
          <p className="text-sm" style={{ color: primaryColor }}>Try adjusting your search or filters or add a new record.</p>
        </div>
      ) : (
        attendanceData.map((record) => (
          <Card 
            key={record.id} 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white relative rounded-xl overflow-hidden flex-shrink-0" 
            style={{ width: '280px', minWidth: '280px', borderWidth: 2, borderStyle: 'solid', borderColor: secondaryColor }}
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
                  <Pencil className="h-4 w-4" style={{ color: primaryColor }} />
                </button>
              )}

              <div className="flex items-start justify-between mb-3 pr-8">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                    {record.studentName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-white">{record.studentId}</p>
                </div>
                {(() => {
                  const v = (record.status || '').toString().toLowerCase()
                  const label = v === 'planned' ? 'Planned leave' : v === 'absent' ? 'Unplanned Leave' : (v ? v.charAt(0).toUpperCase() + v.slice(1) : '-')
                  const cls = v === 'present' ? 'bg-green-100 text-green-800' : v === 'planned' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  return (
                    <Badge className={cls}>
                      {label}
                    </Badge>
                  )
                })()}
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-white">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400 dark:text-white" />
                  {record.date ? new Date(record.date).toLocaleDateString('en-GB') : '-'}
                </div>

                {(record.startTime || record.endTime) && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-white">
                    <Clock className="h-4 w-4 mr-2 text-gray-400 dark:text-white" />
                    {record.startTime || '-'} - {record.endTime || '-'}
                  </div>
                )}

                {/* Removed Course Name/ID and Cohort Name/ID display per requirement */}

                {(record.cohortInstructor || record.cohortTiming) && (
                  <div className="flex items-start text-sm text-gray-600 dark:text-white">
                    <User className="h-4 w-4 mr-2 mt-0.5 text-gray-400 dark:text-white flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {record.cohortInstructor && (
                        <p className="text-xs text-gray-500 dark:text-white truncate">
                          {record.cohortInstructor}
                        </p>
                      )}
                      {record.cohortTiming && (
                        <p className="text-xs text-gray-500 dark:text-white truncate">
                          {record.cohortTiming}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {record.notes && (
                  <div className="flex items-start text-sm text-gray-600 dark:text-white">
                    <NotepadText className="h-4 w-4 mr-2 mt-0.5 text-gray-400 dark:text-white flex-shrink-0" />
                    <p className="text-xs text-gray-600 dark:text-white line-clamp-2" title={record.notes}>
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
