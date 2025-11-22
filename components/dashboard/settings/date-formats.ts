export interface DateFormatOption {
  format: string
  label: string
}

export const DATE_FORMATS: DateFormatOption[] = [
  // ISO standard
  { format: "YYYY-MM-DD", label: "YYYY-MM-DD (2024-01-15)" },

  // Common formats with slashes
  { format: "MM/DD/YYYY", label: "MM/DD/YYYY (01/15/2024)" },
  { format: "DD/MM/YYYY", label: "DD/MM/YYYY (15/01/2024)" },
  { format: "YYYY/MM/DD", label: "YYYY/MM/DD (2024/01/15)" },

  // Common formats with dashes
  { format: "DD-MM-YYYY", label: "DD-MM-YYYY (15-01-2024)" },
  { format: "MM-DD-YYYY", label: "MM-DD-YYYY (01-15-2024)" },

  // Common formats with dots
  { format: "DD.MM.YYYY", label: "DD.MM.YYYY (15.01.2024)" },

  // Text month formats
  { format: "MMM DD, YYYY", label: "MMM DD, YYYY (Jan 15, 2024)" },
  { format: "DD MMM YYYY", label: "DD MMM YYYY (15 Jan 2024)" },
]
