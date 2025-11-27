"use client"

import React, { useMemo, useRef, useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Upload, Download, Check, X, Plus } from "lucide-react"
import { format as formatDateFns } from 'date-fns'
import { formatDateForDisplay } from '@/lib/dashboard/student/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/dashboard/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/dashboard/ui/popover"
import { Progress } from "@/components/dashboard/ui/progress"
import { useToast } from "@/components/dashboard/ui/use-toast"
import type { Achievement } from "@/types/dashboard/achievement"
import { useCustomColors } from "@/lib/use-custom-colors"
import { sortButtonClass, getSortButtonStyle } from "@/lib/dashboard/sort-button-style"

type ViewMode = "list" | "grid"

interface AchievementSearchFiltersProps {
  achievements: Achievement[]
  setFiltered: React.Dispatch<React.SetStateAction<Achievement[]>>
  searchTerm: string
  setSearchTerm: (t: string) => void
  sortBy: string
  setSortBy: (s: string) => void
  sortOrder: "asc" | "desc"
  setSortOrder: (o: "asc" | "desc") => void
  viewMode: ViewMode
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>
  onAdd?: () => void
  onImport?: (items: Achievement[]) => void
  selectedIds?: string[]
  disabled?: boolean
}

export default function AchievementSearchFilters({
  achievements,
  setFiltered,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  onAdd,
  onImport,
  selectedIds = [],
  disabled = false,
}: AchievementSearchFiltersProps) {
  const { toast } = useToast()
  const { primaryColor } = useCustomColors()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const todayIso = React.useMemo(() => new Date().toISOString().split('T')[0], [])
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterAction, setFilterAction] = useState<"applied" | "cleared" | null>(null)
  const [pending, setPending] = useState({
    type: [] as ("individual" | "group")[],
    studentId: [] as string[],
    dateRange: { start: "", end: "" },
  })
  const [selected, setSelected] = useState({
    type: [] as ("individual" | "group")[],
    studentId: [] as string[],
    dateRange: { start: "", end: "" },
  })

  const allStudentIds = useMemo(() => Array.from(new Set(achievements.map(a => a.studentId).filter(Boolean))), [achievements])

  const filtered = useMemo(() => {
    let data = achievements
    // search on title/description
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      data = data.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    }
    if (selected.type.length) {
      data = data.filter(a => selected.type.includes(a.type))
    }
    if (selected.studentId.length) {
      data = data.filter(a => selected.studentId.includes(a.studentId))
    }
    if (selected.dateRange.start) {
      data = data.filter(a => a.createdAt >= new Date(selected.dateRange.start))
    }
    if (selected.dateRange.end) {
      data = data.filter(a => a.createdAt <= new Date(selected.dateRange.end))
    }
    // sort
    data = [...data].sort((a, b) => {
      let va: any
      let vb: any
      switch (sortBy) {
        case "title":
          va = a.title.toLowerCase(); vb = b.title.toLowerCase(); break
        case "type":
          va = a.type; vb = b.type; break
        case "date":
          va = a.createdAt.getTime(); vb = b.createdAt.getTime(); break
        case "likes":
          va = a.likes; vb = b.likes; break
        case "shares":
          va = a.shares; vb = b.shares; break
        default:
          va = a.createdAt.getTime(); vb = b.createdAt.getTime()
      }
      if (va < vb) return sortOrder === "asc" ? -1 : 1
      if (va > vb) return sortOrder === "asc" ? 1 : -1
      return 0
    })
    return data
  }, [achievements, searchTerm, selected, sortBy, sortOrder])

  React.useEffect(() => { setFiltered(filtered) }, [filtered, setFiltered])

  // import/export
  const [importing, setImporting] = useState(false)
  const [stats, setStats] = useState({ processed: 0, total: 0 })

  function toCSV(rows: Achievement[]) {
    const headers = ["type","title","description","photoUrl","createdAt","likes","congratulations","shares","studentId"]
    const esc = (v: any) => {
      const s = v == null ? "" : String(v)
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    const lines = [headers.join(",")]
    rows.forEach(r => {
      const o: any = r
      lines.push(headers.map(h => {
        const val = o[h]
        if (h === 'createdAt') {
          // createdAt may be a Date or ISO string
          const ds = val instanceof Date ? val.toISOString().slice(0,10) : String(val || '')
          return esc(formatDateForDisplay(ds))
        }
        return esc(val)
      }).join(","))
    })
    return lines.join("\n")
  }
  function download(name: string, content: string, type = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function handleExportSelected() {
    if (!selectedIds?.length) return handleExportAll()
    const map = new Map(achievements.map(a => [a.id, a] as const))
    download(`achievements-selected-${formatDateFns(new Date(), 'dd-MMM-yyyy')}.csv`, toCSV(selectedIds.map(id => map.get(id)!).filter(Boolean) as Achievement[]))
  }
  function handleExportAll() {
    download(`achievements-all-${formatDateFns(new Date(), 'dd-MMM-yyyy')}.csv`, toCSV(achievements))
  }
  function parseCSV(text: string) {
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (!lines.length) return [] as any[]
    const split = (line: string) => {
      const out: string[] = []; let cur = ''; let inQ = false
      for (let i=0;i<line.length;i++) { const ch=line[i]; if(inQ){ if(ch==='"'&&line[i+1]==='"'){cur+='"'; i++;} else if(ch==='"'){inQ=false;} else cur+=ch; } else { if(ch===','){out.push(cur); cur='';} else if(ch==='"'){inQ=true;} else cur+=ch; } }
      out.push(cur); return out
    }
    const headers = split(lines[0]).map(h => h.trim())
    return lines.slice(1).map(l => { const cols = split(l); const o:any = {}; headers.forEach((h,idx)=>o[h]=cols[idx]); return o })
  }
  function normalize(o: any): Achievement {
    return {
      id: o.id || o._id || Math.random().toString(36).slice(2),
      type: (o.type || '').toLowerCase()==='group' ? 'group' : 'individual',
      title: o.title || '',
      description: o.description || '',
      photoUrl: o.photoUrl || '',
      createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
      likes: Number(o.likes ?? 0) || 0,
      congratulations: Number(o.congratulations ?? 0) || 0,
      shares: Number(o.shares ?? 0) || 0,
      studentId: o.studentId || '',
    }
  }
  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if(!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const text = String(reader.result || '')
        let rows: any[] = []
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          const json = JSON.parse(text); rows = Array.isArray(json)? json : [json]
        } else {
          rows = parseCSV(text)
        }
        const items = rows.map(normalize)
        setImporting(true); setStats({ processed: 0, total: items.length })
        const inserted: Achievement[] = []
        for (let i=0;i<items.length;i++) {
          try {
            const res = await fetch('/api/dashboard/student/achievements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(items[i]) })
            if (res.ok) { inserted.push(await res.json()) }
          } catch {}
          setStats({ processed: i+1, total: items.length })
        }
        onImport?.(inserted)
        toast({ title: 'Import complete', description: `${inserted.length} achievements added` })
      } catch {
        toast({ title: 'Import failed', description: 'Could not parse file', variant: 'destructive' })
      } finally { setImporting(false); if (e.target) e.target.value = '' }
    }
    reader.readAsText(file)
  }

  return (
    <div className={"flex flex-col lg:flex-row gap-2 mb-4 " + (disabled ? "pointer-events-none opacity-50 grayscale" : "")}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
        <Input placeholder="Search achievements..." className="pl-10" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} disabled={disabled} />
      </div>
      <div className="flex gap-2 items-center">
        {/* View toggle */}
        <div className="flex border rounded-md">
          <Button variant={viewMode==='list'? 'default':'ghost'} size="sm" onClick={()=>setViewMode('list')} className="rounded-r-none" title="List View" disabled={disabled}>
            <div className="flex flex-col gap-0.5 w-4 h-4"><div className="bg-current h-0.5 rounded-sm"></div><div className="bg-current h-0.5 rounded-sm"></div><div className="bg-current h-0.5 rounded-sm"></div></div>
          </Button>
          <Button variant={viewMode==='grid'? 'default':'ghost'} size="sm" onClick={()=>setViewMode('grid')} className="rounded-l-none border-l" title="Grid View" disabled={disabled}>
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4"><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div></div>
          </Button>
        </div>
        {/* Filters */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 flex items-center gap-1 relative" aria-label="Filter options" title="Filter" disabled={disabled}>
              <span className="relative inline-block">
                <Filter className="h-3.5 w-3.5 text-purple-500" />
                {filterAction && (
                  <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                    <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full ${filterAction==='applied' ? 'bg-green-500':'bg-red-500'}`}>
                      {filterAction==='applied' ? <Check className="w-2 h-2 text-white"/> : <X className="w-2 h-2 text-white"/>}
                    </span>
                  </span>
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4">
            <div className="space-y-3">
              <div>
                <div className="mb-1 font-semibold text-sm">Type</div>
                <div className="flex gap-2 flex-wrap">
                  {["individual","group"].map(t => (
                    <label key={t} className="flex items-center gap-1 text-xs p-1 hover:bg-gray-100 rounded cursor-pointer">
                      <input type="checkbox" disabled={disabled} checked={pending.type.includes(t as any)} onChange={()=>setPending(prev=>({ ...prev, type: prev.type.includes(t as any) ? prev.type.filter(x=>x!==t) as any : [...prev.type, t as any] }))} /> {t}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 font-semibold text-sm">Student</div>
                <div className="flex gap-2 flex-wrap max-h-40 overflow-auto">
                  {allStudentIds.map(id => (
                    <label key={id} className="flex items-center gap-1 text-xs p-1 hover:bg-gray-100 rounded cursor-pointer">
                      <input type="checkbox" disabled={disabled} checked={pending.studentId.includes(id)} onChange={()=>setPending(prev=>({ ...prev, studentId: prev.studentId.includes(id) ? prev.studentId.filter(x=>x!==id) : [...prev.studentId, id] }))} /> {id}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="mb-1 font-semibold text-sm">From</div>
                  <Input
                    type="date"
                    value={pending.dateRange.start}
                    onChange={e=>setPending(prev=>({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                    max={(pending.dateRange.end && pending.dateRange.end < todayIso) ? pending.dateRange.end : todayIso}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <div className="mb-1 font-semibold text-sm">To</div>
                  <Input
                    type="date"
                    value={pending.dateRange.end}
                    onChange={e=>setPending(prev=>({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                    min={pending.dateRange.start || undefined}
                    max={todayIso}
                    disabled={disabled}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" disabled={disabled} onClick={()=>{ setSelected(pending); setFilterOpen(false); setFilterAction('applied'); setTimeout(()=>setFilterAction(null), 2000); }}>Apply</Button>
                <Button size="sm" variant="outline" className="flex-1" disabled={disabled} onClick={()=>{ setPending({ type: [], studentId: [], dateRange: { start: "", end: "" } }); setSelected({ type: [], studentId: [], dateRange: { start: "", end: "" } }); setFilterOpen(false); setFilterAction('cleared'); setTimeout(()=>setFilterAction(null), 2000); }}>Clear</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={sortButtonClass}
              style={getSortButtonStyle(primaryColor)}
              title="Sort"
              disabled={disabled}
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="ml-1 text-xs">
                {sortBy==='title'?'Title':sortBy==='type'?'Type':sortBy==='likes'?'Likes':sortBy==='shares'?'Shares':'Date'}
              </span>
              {sortOrder==='asc' ? (
                <ArrowUp className="ml-2 h-3 w-3" />
              ) : (
                <ArrowDown className="ml-2 h-3 w-3" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[{value:'date',label:'Date'},{value:'title',label:'Title'},{value:'type',label:'Type'},{value:'likes',label:'Likes'},{value:'shares',label:'Shares'}].map(o=> (
              <DropdownMenuItem key={o.value} onClick={()=>setSortBy(o.value)}>
                <span>{o.label}</span>
                {sortBy === o.value && (
                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Order</DropdownMenuLabel>
            <DropdownMenuItem onClick={()=>setSortOrder('asc')}>
              <span className="flex items-center gap-2">
                Ascending
                <ArrowUp className="h-4 w-4" />
              </span>
              {sortOrder==='asc' && (
                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={()=>setSortOrder('desc')}>
              <span className="flex items-center gap-2">
                Descending
                <ArrowDown className="h-4 w-4" />
              </span>
              {sortOrder==='desc' && (
                <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Import/Export */}
        <input ref={fileRef} type="file" accept=".csv,application/json,text/csv,application/vnd.ms-excel" className="hidden" onChange={handleImportFile} />
        <Button variant="outline" size="sm" title="Import" onClick={()=>fileRef.current?.click()} disabled={importing || disabled}>
          <Upload className="mr-2 h-4 w-4" /> {importing? 'Importing...':'Import'}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" title={selectedIds.length? `Export (${selectedIds.length} selected)` : 'Export'} disabled={disabled}>
              <Download className="mr-2 h-4 w-4" /> {selectedIds.length? `Export (${selectedIds.length})` : 'Export'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleExportSelected} disabled={!selectedIds.length || disabled}>Export selected</DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportAll} disabled={disabled}>Export all records</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" className="bg-[#8A2BE2] hover:bg-[#7A1FD2]" onClick={onAdd} disabled={disabled}><Plus className="h-4 w-4 mr-2"/>Add Achievement</Button>
      </div>
      {importing && (
        <div className="w-full flex items-center gap-4 mt-2">
          <div className="flex-1 max-w-xs"><Progress value={stats.total? (stats.processed/stats.total)*100 : 0} /></div>
          <div className="text-xs text-muted-foreground">{stats.processed}/{stats.total} rows</div>
        </div>
      )}
    </div>
  )
}
