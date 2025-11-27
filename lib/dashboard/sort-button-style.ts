import type { CSSProperties } from "react"

export type CSSPropertiesWithVars = CSSProperties & Record<string, string>

export const sortButtonClass = "h-9 flex items-center gap-1 border text-[color:var(--sort-icon-color)] hover:bg-[color:var(--sort-hover-bg)] hover:text-white"

export const getSortButtonStyle = (primaryColor: string): CSSPropertiesWithVars => ({
  borderColor: primaryColor,
  color: primaryColor,
  backgroundColor: `${primaryColor}15`,
  "--sort-icon-color": primaryColor,
  "--sort-hover-bg": primaryColor,
})
