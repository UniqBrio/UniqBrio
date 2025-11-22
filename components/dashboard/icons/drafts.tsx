"use client"

import * as React from "react"

// A reusable Drafts icon component using the same SVG path previously inlined
// Accepts standard SVG props for sizing and styling.
export function DraftsIcon(
  { className, width = 18, height = 18, ...props }: React.SVGProps<SVGSVGElement>
) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
    </svg>
  )
}

export default DraftsIcon
