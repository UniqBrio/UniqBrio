export function toCSV<T extends Record<string, any>>(rows: T[], headers?: Array<keyof T | string>) {
  if (rows.length === 0) return ""
  const cols = headers ?? (Object.keys(rows[0]) as Array<keyof T>)
  
  const esc = (v: any) => {
    if (v === null || v === undefined) return ""
    const s = String(v)
    // Always quote for better Excel compatibility and auto-width
    return '"' + s.replace(/"/g, '""') + '"'
  }
  
  // Add Excel separator directive for better recognition
  const separator = "sep=,\n"
  
  const head = cols.map((c) => esc(String(c))).join(",")
  const body = rows
    .map((r) => cols.map((c) => esc(r[c as keyof T])).join(","))
    .join("\n")
    
  return separator + head + "\n" + body
}

export function downloadCSV(filename: string, csv: string) {
  // Add UTF-8 BOM to help Excel properly recognize and auto-format the CSV
  const BOM = '\uFEFF'
  const csvWithBOM = BOM + csv
  
  // Use Excel-optimized MIME type and encoding for better auto-width recognition
  const blob = new Blob([csvWithBOM], { 
    type: "application/vnd.ms-excel;charset=utf-8;" 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  // Add Excel-specific attributes
  a.setAttribute('type', 'application/vnd.ms-excel')
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
