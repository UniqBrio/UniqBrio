"use client"

import React from "react"
import { Skeleton } from "@/components/dashboard/ui/skeleton"

interface InstructorListSkeletonProps {
  viewMode: 'grid' | 'list'
  count?: number
}

const InstructorListSkeleton: React.FC<InstructorListSkeletonProps> = ({ 
  viewMode, 
  count = 6 
}) => {
  if (viewMode === 'list') {
    return (
      <div className="px-6 pb-6">
        <div 
          style={{ height: '240px', overflowY: 'auto', overflowX: 'auto', scrollbarWidth: 'thin' }}
          className="instructor-list-scroll"
        >
          <table className="w-full min-w-max text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-white w-10">
                  <Skeleton className="h-4 w-4 rounded" />
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-white w-20">
                  <Skeleton className="h-4 w-12" />
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-white w-40">
                  <Skeleton className="h-4 w-16" />
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-white w-44">
                  <Skeleton className="h-4 w-12" />
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-white w-20">
                  <Skeleton className="h-4 w-16" />
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-700 dark:text-white w-12">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-700 dark:text-white w-12"></th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-700 dark:text-white w-12"></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: count }).map((_, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-4 rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-8" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Grid View Skeleton
  return (
    <div className="px-6 pb-6 relative">
      <div
        className="flex gap-4 pb-2 overflow-x-auto overflow-y-hidden scroll-smooth instructor-grid-scroll"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#9ca3af #f3f4f6',
          minHeight: 180
        }}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm p-4 h-[220px] flex-shrink-0"
            style={{ minWidth: '320px', width: '320px' }}
          >
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
            <div className="flex gap-2 mb-2 flex-wrap">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>
            
            <div className="mb-1">
              <Skeleton className="h-3 w-8 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            
            <div className="mb-1">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-12" />
            </div>
            
            <div className="absolute bottom-2 right-2">
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default InstructorListSkeleton
