"use client"

import { useMemo } from "react"
import { formatDateForDisplay } from "@/lib/dashboard/student/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/ui/table"
import { StickyTable } from "@/components/dashboard/ui/staff/sticky-table"
import { Badge } from "@/components/dashboard/ui/badge"
import { Trash2, Users } from "lucide-react"
import type { LeaveRecord } from "./types"

interface LeaveTableProps {
  leaveData: LeaveRecord[];
  selectedIds?: string[];
  onToggleSelect?: (id: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  displayedColumns?: string[];
  onSelectRecord?: (record: LeaveRecord) => void;
  onDeleteRecord?: (record: LeaveRecord) => void;
}

export function LeaveTable({ 
  leaveData, 
  selectedIds = [], 
  onToggleSelect, 
  onToggleSelectAll, 
  displayedColumns, 
  onSelectRecord,
  onDeleteRecord,
}: LeaveTableProps) {
  const data = leaveData || [];

  const cols = useMemo(() => {
    const defaultCols = [
  'Student ID', 'Student Name', 'Leave Count', 'Date', 'Status', 'Course Details', 'Cohort Details', 'Remarks'
    ];
    let base = (displayedColumns && displayedColumns.length > 0 ? displayedColumns : defaultCols)
      .filter(c => defaultCols.includes(c));
    if (onDeleteRecord && !base.includes('Actions')) {
      base = [...base, 'Actions'];
    }
    return base;
  }, [displayedColumns, onDeleteRecord]);

  // Calculate leave count for each student
  const studentLeaveCounts = useMemo(() => {
    const counts = new Map<string, number>();
    leaveData.forEach(record => {
      const studentId = record.studentId;
      counts.set(studentId, (counts.get(studentId) || 0) + 1);
    });
    return counts;
  }, [leaveData]);

  const studentLeaveOrder = useMemo(() => {
    const runningCounts = new Map<string, number>();
    const order = new Map<number, number>();

    [...data].reverse().forEach(record => {
      const nextValue = (runningCounts.get(record.studentId) || 0) + 1;
      runningCounts.set(record.studentId, nextValue);
      order.set(record.id, nextValue);
    });

    return order;
  }, [data]);

  const allVisibleIds = useMemo(() => data.map(r => r.id.toString()), [data]);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.includes(id));

  const renderCell = (row: LeaveRecord, column: string) => {
    switch (column) {
      case 'Student ID':
        return row.studentId || `STU-${row.id}`;
      case 'Student Name':
        return row.studentName || '-';
      case 'Leave Count':
        const leaveCount = studentLeaveCounts.get(row.studentId) || 0;
        const leaveOrder = studentLeaveOrder.get(row.id) || leaveCount || 0;
        return leaveCount === 0 ? '-' : `${leaveOrder}/${leaveCount}`;
      case 'Course Details':
        return (
          <div className="space-y-1">
            <div className="font-medium text-sm truncate" title={row.courseName}>{row.courseName || '-'}</div>
            <div className="text-xs text-gray-500 dark:text-white truncate" title={row.courseId}>{row.courseId || '-'}</div>
          </div>
        );
      case 'Cohort Details':
        return (
          <div className="space-y-1">
            <div className="font-medium text-sm truncate" title={row.cohortName && row.cohortId ? `${row.cohortName} (${row.cohortId})` : row.cohortName || row.cohortId}>
              {row.cohortName && row.cohortId ? `${row.cohortName} (${row.cohortId})` : row.cohortName || row.cohortId || '-'}
            </div>
            <div className="text-xs text-gray-500 dark:text-white truncate" title={row.cohortInstructor}>{row.cohortInstructor || '-'}</div>
            <div className="text-xs text-gray-400 dark:text-white truncate" title={row.cohortTiming}>{row.cohortTiming || '-'}</div>
          </div>
        );
      case 'Date':
        return row.date ? formatDateForDisplay(row.date) : '-';
      case 'Status':
        return (
          <Badge className="bg-red-100 text-red-800">
            Absent
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
          <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {onDeleteRecord && (
              <button
                type="button"
                className="rounded p-2 text-red-600 transition-colors hover:bg-red-100"
                onClick={() => onDeleteRecord(row)}
                aria-label="Delete leave"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      default:
        return '-';
    }
  };

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-white bg-white dark:bg-gray-900 rounded-xl border border-dashed border-purple-200 dark:border-purple-800">
        <Users className="h-16 w-16 text-gray-300 dark:text-white mb-4" />
        <h3 className="text-lg font-medium mb-2">No leave records found</h3>
        <p className="text-sm">All students were present during the selected period</p>
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
              className="accent-purple-600 cursor-pointer"
              checked={allSelected}
              onChange={(e) => onToggleSelectAll?.(e.target.checked)}
            />
          );
        }
        if (col === 'Actions') {
          return null;
        }
        return col;
      }}
    >
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={cols.length + (onToggleSelect ? 1 : 0)} className="text-center text-gray-500 dark:text-white py-10 text-sm">
              No leave records found
            </TableCell>
          </TableRow>
        ) : (
          data.map(row => {
            const isSelected = selectedIds.includes(row.id.toString());
            return (
              <TableRow
                key={row.id}
                className={`border-b hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-purple-50/60' : ''}`}
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
    </StickyTable>
  );
}
