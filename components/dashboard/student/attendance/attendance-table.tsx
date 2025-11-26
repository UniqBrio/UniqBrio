"use client"

import { useMemo } from "react"
import { formatDateForDisplay, formatTimeTo12Hour, formatTimesInTextTo12Hour } from "@/lib/dashboard/student/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import { StickyTable } from "@/components/dashboard/ui/staff/sticky-table"
import { Badge } from "@/components/dashboard/ui/badge"
import { Pencil, Trash2, Users } from "lucide-react"
import { useCustomColors } from "@/lib/use-custom-colors";

interface StudentAttendanceRecord {
  id: string; // MongoDB ObjectId string
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

interface AttendanceTableProps {
  attendanceData: StudentAttendanceRecord[];
  selectedIds?: string[];
  onToggleSelect?: (id: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  displayedColumns?: string[]; // If provided, render only these columns (except selection)
  onEditRecord?: (record: StudentAttendanceRecord) => void;
  onDeleteRecord?: (record: StudentAttendanceRecord) => void;
  onSelectRecord?: (record: StudentAttendanceRecord) => void;
}

// Mock data for demonstration


export function AttendanceTable({ attendanceData, selectedIds = [], onToggleSelect, onToggleSelectAll, displayedColumns, onEditRecord, onDeleteRecord, onSelectRecord }: AttendanceTableProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const data = attendanceData || [];

  const cols = useMemo(() => {
    const defaultCols = [
      'Student ID', 'Student Name', 'Date', 'Status', 'Course Details', 'Cohort Details', 'Start Time', 'End Time', 'Remarks'
    ];
    let base = (displayedColumns && displayedColumns.length > 0 ? displayedColumns : defaultCols)
      .filter(c => defaultCols.includes(c));
    if ((onEditRecord || onDeleteRecord) && !base.includes('Actions')) {
      base = [...base, 'Actions'];
    }
    return base;
  }, [displayedColumns, onEditRecord, onDeleteRecord]);

  const allVisibleIds = useMemo(() => data.map(r => r.id.toString()), [data]);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.includes(id));

  const renderCell = (row: StudentAttendanceRecord, column: string) => {
    switch (column) {
      case 'Student ID':
        return row.studentId || `STU-${row.id}`;
      case 'Student Name':
        return row.studentName || '-';
      case 'Course Details':
        return (
          <div className="space-y-1">
            <div className="font-medium text-sm truncate" title={row.courseName}>{row.courseName || '-'}</div>
            <div className="text-xs text-gray-500 dark:text-white truncate" title={row.courseId}>
              {row.courseId ? row.courseId : '-'}
            </div>
          </div>
        );
      case 'Cohort Details':
        return (
          <div className="space-y-1">
            <div className="font-medium text-sm truncate" title={row.cohortName && row.cohortId ? `${row.cohortName} (${row.cohortId})` : row.cohortName || row.cohortId}>
              {row.cohortName && row.cohortId ? `${row.cohortName} (${row.cohortId})` : row.cohortName || row.cohortId || '-'}
            </div>
            <div className="text-xs text-gray-500 dark:text-white truncate" title={row.cohortInstructor}>{row.cohortInstructor || '-'}</div>
            <div className="text-xs text-gray-400 dark:text-white truncate" title={row.cohortTiming}>{row.cohortTiming ? formatTimesInTextTo12Hour(row.cohortTiming) : '-'}</div>
          </div>
        );
      case 'Date':
        return row.date ? formatDateForDisplay(row.date) : '-';
      case 'Start Time':
        return row.startTime ? formatTimeTo12Hour(row.startTime) : '-';
      case 'End Time':
        return row.endTime ? formatTimeTo12Hour(row.endTime) : '-';
      case 'Status':
        return (
          <Badge className={
            row.status === 'present'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }>
            {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : '-'}
          </Badge>
        );
      case 'Remarks':
        return (
          <div className="text-sm text-gray-600 dark:text-white truncate max-w-xs" title={row.notes}>
            {row.notes || '-'}
          </div>
        );
      case 'Actions':
        return (
          <div className="flex gap-2 justify-center items-center" onClick={e => e.stopPropagation()}>
            {onEditRecord && (
              <span
                role="button"
                aria-label="Edit"
                className="cursor-pointer text-sm hover:bg-gray-100 p-2 rounded transition-colors inline-block"
                onClick={() => onEditRecord(row)}
              >
                <Pencil className="h-4 w-4" style={{ color: primaryColor }} />
              </span>
            )}
            {onDeleteRecord && (
              <span
                role="button"
                aria-label="Delete"
                className="cursor-pointer text-sm hover:bg-red-100 p-2 rounded transition-colors inline-block"
                onClick={() => onDeleteRecord(row)}
              >
                <Trash2 className="text-red-600 h-4 w-4" />
              </span>
            )}
          </div>
        );
      default:
        return '-';
    }
  };

  // Empty state (match student list style)
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-white bg-white rounded-xl border border-dashed" style={{ borderColor: `${primaryColor}80` }}>
        <Users className="h-16 w-16 text-gray-300 dark:text-white mb-4" />
        <h3 className="text-lg font-medium mb-2">No attendance records found</h3>
        <p className="text-sm">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <StickyTable
      height={360}
      columns={[
        ...(onToggleSelect ? ['__select'] : []),
        ...cols,
      ]}
      includeActionsColumn={false}
      renderHeaderCell={(col) => {
        if (col === '__select') {
          return (
            <input
              type="checkbox"
              className="cursor-pointer"
              style={{ accentColor: primaryColor }}
              checked={allSelected}
              onChange={(e) => onToggleSelectAll?.(e.target.checked)}
            />
          );
        }
        if (col === 'Actions') {
          // Leave the Actions column header empty
          return null;
        }
        return col;
      }}
    >
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={cols.length + (onToggleSelect ? 1 : 0)} className="text-center text-gray-500 dark:text-white py-10 text-sm">
              No attendance records found
            </TableCell>
          </TableRow>
        ) : (
          data.map(row => {
            const isSelected = selectedIds.includes(row.id.toString());
            return (
              <TableRow
                key={row.id}
                className="border-b hover:bg-gray-50"
                style={isSelected ? { backgroundColor: `${primaryColor}15` } : {}}
                onClick={() => { onSelectRecord?.(row); }}
              >
                {onToggleSelect && (
                  <TableCell className="w-10 px-4" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      style={{ accentColor: primaryColor }}
                      checked={isSelected}
                      onChange={(e) => onToggleSelect(row.id.toString(), e.target.checked)}
                    />
                  </TableCell>
                )}
                {cols.map(col => (
                  <TableCell key={col} className={`px-6 py-4 ${col === 'Actions' ? 'text-center' : ''}`}>
                    {renderCell(row, col)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </StickyTable>
  );
}
