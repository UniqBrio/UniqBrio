"use client"

import { useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import { Badge } from "@/components/dashboard/ui/badge"
import { Pencil, Trash2, Users } from "lucide-react"

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
  const data = attendanceData || [];

  // Format date as dd-MMM-yyyy (e.g., 23-Oct-2025) for consistent display
  const formatDisplayDate = (s?: string) => {
    if (!s) return "-";
    try {
      const d = new Date(s);
      if (isNaN(d.getTime())) return s;
      return d
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .replace(/ /g, "-");
    } catch {
      return s;
    }
  };

  const cols = useMemo(() => {
    const defaultCols = [
      'Non-Instructor ID', 'Non-Instructor Name', 'Date', 'Status', 'Start Time', 'End Time', 'Remarks'
    ];
    let base = (displayedColumns && displayedColumns.length > 0 ? displayedColumns : defaultCols)
      .filter(c => defaultCols.includes(c));
    // Defensive: ensure mandatory columns are always present
    ['Non-Instructor ID', 'Non-Instructor Name'].forEach(m => { if (!base.includes(m)) base.unshift(m); });
    if ((onEditRecord || onDeleteRecord) && !base.includes('Actions')) {
      base = [...base, 'Actions'];
    }
    return base;
  }, [displayedColumns, onEditRecord, onDeleteRecord]);

  const allVisibleIds = useMemo(() => data.map(r => r.id.toString()), [data]);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.includes(id));

  const renderCell = (row: StudentAttendanceRecord, column: string) => {
    const displayStatus = (s?: string) => {
      if (!s) return '-'
      const v = s.toLowerCase()
      if (v === 'planned') return 'Planned leave'
      if (v === 'absent') return 'Unplanned Leave'
      return v.charAt(0).toUpperCase() + v.slice(1)
    }
    const isPlanned = (row.status || '').toString().toLowerCase() === 'planned'
    switch (column) {
      case 'Non-Instructor ID':
        return row.studentId || `STU-${row.id}`;
      case 'Non-Instructor Name':
        return row.studentName || '-';
      case 'Date':
        return formatDisplayDate(row.date);
      case 'Start Time':
        return row.startTime || '-';
      case 'End Time':
        return row.endTime || '-';
      case 'Status':
        return (
          <Badge className={
            row.status === 'present'
              ? 'bg-green-100 text-green-800'
              : row.status === 'planned'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
          }>
            {displayStatus(row.status)}
          </Badge>
        );
      case 'Remarks':
        return (
          <div className="text-sm text-gray-600 truncate max-w-xs" title={row.notes}>
            {row.notes || '-'}
          </div>
        );
      case 'Actions':
        return (
          <div className="flex gap-2 justify-center items-center" onClick={e => e.stopPropagation()}>
            {onEditRecord && (
              <span
                role={isPlanned ? undefined : 'button'}
                aria-label="Edit"
                aria-disabled={isPlanned || undefined}
                title={isPlanned ? 'Cannot edit a Planned leave record' : 'Edit'}
                className={`text-sm p-2 rounded transition-colors inline-block ${isPlanned ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
                onClick={isPlanned ? undefined : () => onEditRecord(row)}
              >
                <Pencil className={`h-4 w-4 ${isPlanned ? '' : 'text-purple-600'}`} />
              </span>
            )}
            {onDeleteRecord && (
              <span
                role={isPlanned ? undefined : 'button'}
                aria-label="Delete"
                aria-disabled={isPlanned || undefined}
                title={isPlanned ? 'Cannot delete a Planned leave record' : 'Delete'}
                className={`text-sm p-2 rounded transition-colors inline-block ${isPlanned ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-red-100'}`}
                onClick={isPlanned ? undefined : () => onDeleteRecord(row)}
              >
                <Trash2 className={`h-4 w-4 ${isPlanned ? '' : 'text-red-600'}`} />
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
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-white rounded-xl border border-dashed border-purple-200">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium mb-2">No attendance records found</h3>
        <p className="text-sm">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table containerClassName="max-h-[360px]">
        <TableHeader className="sticky top-0 bg-white z-20 shadow-sm">
          <TableRow>
            {(onToggleSelect ? ['__select'] : []).concat(cols).map((col) => (
              <TableHead key={col} className="sticky top-0 bg-white z-20 px-6 py-3 text-left text-sm font-semibold text-gray-700">
                {col === '__select' ? (
                  <input
                    type="checkbox"
                    className="accent-purple-600 cursor-pointer"
                    checked={allSelected}
                    onChange={(e) => onToggleSelectAll?.(e.target.checked)}
                  />
                ) : col === 'Actions' ? (
                  null
                ) : (
                  col
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={cols.length + (onToggleSelect ? 1 : 0)} className="text-center text-gray-500 py-10 text-sm">
              No attendance records found
            </TableCell>
          </TableRow>
        ) : (
          data.map(row => {
            const isSelected = selectedIds.includes(row.id.toString());
            return (
              <TableRow
                key={row.id}
                className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-purple-50/60' : ''}`}
                onClick={() => { onSelectRecord?.(row); }}
              >
                {onToggleSelect && (
                  <TableCell className="w-10 px-4" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="accent-purple-600 cursor-pointer"
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
      </Table>
    </div>
  );
}
