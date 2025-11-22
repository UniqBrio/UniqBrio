import React from "react"

export const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M2 6h12" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M5 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M11 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="5" cy="9" r="0.5" fill="currentColor"/>
    <circle cx="8" cy="9" r="0.5" fill="currentColor"/>
    <circle cx="11" cy="9" r="0.5" fill="currentColor"/>
    <circle cx="5" cy="11.5" r="0.5" fill="currentColor"/>
    <circle cx="8" cy="11.5" r="0.5" fill="currentColor"/>
  </svg>
)