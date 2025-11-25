"use client"

import * as React from "react"
import { cn } from "@/lib/dashboard/staff/utils"

/**
 * StickyTable
 * Wrapper that provides a scrollable container with a sticky header row.
 * Usage:
 *  <StickyTable columns={["Date","Amount"]}>
 *    {rows.map(r => (
 *       <tr key={r.id}>...</tr>
 *    ))}
 *  </StickyTable>
 *
 * Or advanced (manual header content):
 *  <StickyTable>
 *    <thead>...</thead>
 *    <tbody>...</tbody>
 *  </StickyTable>
 */
export interface StickyTableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Optional fixed height of the scrollable region (default 360px) */
  height?: number | string
  /** Columns list (simple mode). If omitted, provide your own <thead>. */
  columns?: string[]
  /** Add an actions placeholder column (aligned center) */
  includeActionsColumn?: boolean
  /** Class applied to the outer scroll container */
  containerClassName?: string
  /** Optional render function for header cell replacement (returns node) */
  renderHeaderCell?: (col: string) => React.ReactNode
}

export const StickyTable = React.forwardRef<HTMLTableElement, StickyTableProps>(function StickyTable(
  { height = 360, columns, includeActionsColumn, className, containerClassName, children, renderHeaderCell, ...rest }, ref
) {
  const resolvedCols = React.useMemo(() => {
    if (!columns) return [] as string[];
    let cols = [...columns];
    if (includeActionsColumn && !cols.includes('Actions')) cols.push('Actions');
    return cols;
  }, [columns, includeActionsColumn]);

  return (
    <div className={cn("rounded-xl shadow border overflow-hidden", containerClassName)}>
      <div className={cn("relative overflow-auto", typeof height === 'number' ? `h-[${height}px]` : '')} style={typeof height === 'string' ? { height } : undefined}>
        <table ref={ref} className={cn("w-full text-sm", className)} {...rest}>
          {columns && (
            <thead className="sticky top-0 bg-background dark:bg-gray-900 z-20 shadow-sm">
              <tr className="border-b">
                {resolvedCols.map(col => (
                  <th
                    key={col}
                    className={cn("sticky top-0 bg-background dark:bg-gray-900 z-20 px-6 py-3 text-sm font-semibold text-gray-600 dark:text-white text-left", col === 'Actions' && 'text-center w-28')}
                  >
                    {renderHeaderCell ? renderHeaderCell(col) : (col === 'Actions' ? '' : col)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          {children}
        </table>
      </div>
    </div>
  )
});

StickyTable.displayName = 'StickyTable';
