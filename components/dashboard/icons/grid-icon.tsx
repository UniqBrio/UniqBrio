import React from "react"

export type GridIconProps = {
  className?: string
  color?: string
}

function GridIcon({ className = "w-7 h-7", color = "#7C3AED" }: GridIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* All squares equal size and spacing */}
      {/* Row 1 */}
      <rect x="3" y="3" width="5" height="5" rx="1.5" fill={color} />
      <rect x="9.5" y="3" width="5" height="5" rx="1.5" fill={color} />
      <rect x="16" y="3" width="5" height="5" rx="1.5" fill={color} />
      {/* Row 2 */}
      <rect x="3" y="9.5" width="5" height="5" rx="1.5" fill={color} />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" fill={color} />
      <rect x="16" y="9.5" width="5" height="5" rx="1.5" fill={color} />
      {/* Row 3 */}
      <rect x="3" y="16" width="5" height="5" rx="1.5" fill={color} />
      <rect x="9.5" y="16" width="5" height="5" rx="1.5" fill={color} />
      <rect x="16" y="16" width="5" height="5" rx="1.5" fill={color} />
    </svg>
  )
}

export default GridIcon
export { GridIcon }
