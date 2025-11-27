"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Achievement, AchievementFormData } from "@/types/dashboard/achievement"
import { AchievementCard } from "@/components/dashboard/student/achievements/achievement-card"
import { AchievementDialog } from "@/components/dashboard/student/achievements/achievement-dialog"
import { Input } from "@/components/dashboard/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/ui/card"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Download, Search, Filter, Plus } from "lucide-react"
import AchievementSearchFilters from "@/components/dashboard/student/achievements/achievement-search-filters"

interface StudentAchievementsProps {
  achievements?: Achievement[];
  onAchievementAction?: (type: 'like' | 'congratulate' | 'share', achievementId: string) => void;
  disabled?: boolean;
}

export function StudentAchievements({ achievements = [], onAchievementAction, disabled = false }: StudentAchievementsProps) {
  const [achievementType, setAchievementType] = useState<'all' | 'individual' | 'group'>('all');
  const [showAchievementDialog, setShowAchievementDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("desc");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>("grid");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [all, setAll] = useState<Achievement[]>(achievements);
  const [filtered, setFiltered] = useState<Achievement[]>(achievements);
  const [editing, setEditing] = useState<Achievement | null>(null);

  useEffect(() => {
    setAll(achievements)
    setFiltered(achievements)
  }, [achievements])

  // Filter achievements based on type and search term
  const filteredAchievements = filtered.filter(
    achievement => (
      (achievementType === 'all' || achievement.type === achievementType) &&
      (searchTerm === "" || 
        achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  // Sort achievements
  const sortedAchievements = useMemo(() => {
    const data = [...filteredAchievements]
    data.sort((a,b) => {
      let va:any; let vb:any
      switch (sortBy) {
        case 'title': va=a.title.toLowerCase(); vb=b.title.toLowerCase(); break
        case 'type': va=a.type; vb=b.type; break
        case 'likes': va=a.likes; vb=b.likes; break
        case 'shares': va=a.shares; vb=b.shares; break
        case 'date': default: va=a.createdAt.getTime(); vb=b.createdAt.getTime();
      }
      if (va < vb) return sortOrder==='asc'? -1 : 1
      if (va > vb) return sortOrder==='asc'? 1 : -1
      return 0
    })
    return data
  }, [filteredAchievements, sortBy, sortOrder])

  // Analytics data
  const analyticsData = {
    byType: [
      { name: 'Individual', value: achievements.filter(a => a.type === 'individual').length },
      { name: 'Group', value: achievements.filter(a => a.type === 'group').length }
    ],
    engagement: [
      { name: 'Likes', value: achievements.reduce((acc, a) => acc + a.likes, 0) },
      { name: 'Congratulations', value: achievements.reduce((acc, a) => acc + a.congratulations, 0) },
      { name: 'Shares', value: achievements.reduce((acc, a) => acc + a.shares, 0) }
    ],
    timeline: (() => {
      const months: { [key: string]: { individual: number; group: number } } = {};
      achievements.forEach(a => {
        const month = a.createdAt.toLocaleString('default', { month: 'short' });
        if (!months[month]) months[month] = { individual: 0, group: 0 };
        months[month][a.type]++;
      });
      return Object.entries(months).map(([month, data]) => ({
        month,
        individual: data.individual,
        group: data.group
      }));
    })()
  };

  return (
    <div className={"space-y-6 " + (disabled ? "pointer-events-none opacity-50 grayscale" : "")}>
      {/* Toolbar matching provided UI */}
      <AchievementSearchFilters
        achievements={all}
        setFiltered={setFiltered}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onAdd={() => !disabled && setShowAchievementDialog(true)}
        onImport={(items)=>{
          // Map returned items to Achievement shape and merge
          const mapped: Achievement[] = items.map((created: any) => ({
            id: created._id || created.id,
            type: created.type,
            title: created.title,
            description: created.description,
            photoUrl: created.photoUrl,
            createdAt: created.createdAt ? new Date(created.createdAt) : new Date(),
            likes: created.likes ?? 0,
            congratulations: created.congratulations ?? 0,
            shares: created.shares ?? 0,
            studentId: created.studentId || (typeof created.student === 'string' ? created.student : created.student?._id || ''),
          }))
          setAll(prev => [...mapped, ...prev])
          setFiltered(list => [...mapped, ...list])
        }}
        selectedIds={selectedIds}
      />
      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Achievement Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.byType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#8A2BE2" />
                    <Cell fill="#FFA500" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engagement Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.engagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8A2BE2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="individual" fill="#8A2BE2" stackId="a" />
                  <Bar dataKey="group" fill="#FFA500" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Removed the All / Individual / Group toggle division as requested */}

      {/* Achievements List/Grid with selection */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAchievements.map(achievement => (
            <div key={achievement.id} className="relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selectedIds.includes(achievement.id)}
                  onChange={(e)=> setSelectedIds(prev => e.target.checked ? [...prev, achievement.id] : prev.filter(id => id!==achievement.id))}
                />
              </div>
              <AchievementCard
                achievement={achievement}
                onLike={() => !disabled && onAchievementAction?.('like', achievement.id)}
                onCongratulate={() => !disabled && onAchievementAction?.('congratulate', achievement.id)}
                onShare={() => !disabled && onAchievementAction?.('share', achievement.id)}
              />
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" disabled={disabled} onClick={()=> { setEditing(achievement); setShowAchievementDialog(true) }}>Edit</Button>
                <Button size="sm" variant="destructive" disabled={disabled} onClick={async ()=>{
                  await fetch('/api/dashboard/student/achievements', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: achievement.id }) })
                  // Optimistic removal
                  setAll(list => list.filter(a => a.id !== achievement.id))
                  setFiltered(list => list.filter(a => a.id !== achievement.id))
                }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select all for list view */}
          {sortedAchievements.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                disabled={disabled}
                checked={selectedIds.length === sortedAchievements.length}
                onChange={(e)=> setSelectedIds(e.target.checked ? sortedAchievements.map(a=>a.id) : [])}
              />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>
          )}
          {sortedAchievements.map(achievement => (
            <div key={achievement.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
              <input
                type="checkbox"
                className="mt-1"
                disabled={disabled}
                checked={selectedIds.includes(achievement.id)}
                onChange={(e)=> setSelectedIds(prev => e.target.checked ? [...prev, achievement.id] : prev.filter(id => id!==achievement.id))}
              />
              <div className="flex-1">
                <AchievementCard
                  achievement={achievement}
                  onLike={() => !disabled && onAchievementAction?.('like', achievement.id)}
                  onCongratulate={() => !disabled && onAchievementAction?.('congratulate', achievement.id)}
                  onShare={() => !disabled && onAchievementAction?.('share', achievement.id)}
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" disabled={disabled} onClick={()=> { setEditing(achievement); setShowAchievementDialog(true) }}>Edit</Button>
                  <Button size="sm" variant="destructive" disabled={disabled} onClick={async ()=>{
                    await fetch('/api/dashboard/student/achievements', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: achievement.id }) })
                    setAll(list => list.filter(a => a.id !== achievement.id))
                    setFiltered(list => list.filter(a => a.id !== achievement.id))
                  }}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {sortedAchievements.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500 dark:text-white">
          <h3 className="text-lg font-medium mb-2">No achievements found</h3>
          <p className="text-sm">Add achievements to showcase student accomplishments</p>
        </div>
      )}

      {/* Achievement Dialog */}
      <AchievementDialog
        isOpen={showAchievementDialog}
        onOpenChange={(open)=>{ setShowAchievementDialog(open); if(!open) setEditing(null) }}
        hideTrigger
        initialData={editing ? { type: editing.type, title: editing.title, description: editing.description } : undefined}
        onSubmit={async (data: AchievementFormData) => {
          const payload: any = { type: data.type, title: data.title, description: data.description }
          if (editing) {
            // Update existing
            const res = await fetch('/api/dashboard/student/achievements', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: editing.id, ...payload }) })
            if (res.ok) {
              const updated = await res.json()
              const mapped: Achievement = {
                id: updated._id || updated.id,
                type: updated.type,
                title: updated.title,
                description: updated.description,
                photoUrl: updated.photoUrl,
                createdAt: updated.createdAt ? new Date(updated.createdAt) : new Date(),
                likes: updated.likes ?? 0,
                congratulations: updated.congratulations ?? 0,
                shares: updated.shares ?? 0,
                studentId: updated.studentId || (typeof updated.student === 'string' ? updated.student : updated.student?._id || ''),
              }
              setAll(list => list.map(a => a.id === mapped.id ? mapped : a))
              setFiltered(list => list.map(a => a.id === mapped.id ? mapped : a))
            }
          } else {
            // Create new
            const res = await fetch('/api/dashboard/student/achievements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
            if (res.ok) {
              const created = await res.json()
              const mapped: Achievement = {
                id: created._id || created.id,
                type: created.type,
                title: created.title,
                description: created.description,
                photoUrl: created.photoUrl,
                createdAt: created.createdAt ? new Date(created.createdAt) : new Date(),
                likes: created.likes ?? 0,
                congratulations: created.congratulations ?? 0,
                shares: created.shares ?? 0,
                studentId: created.studentId || (typeof created.student === 'string' ? created.student : created.student?._id || ''),
              }
              setAll(list => [mapped, ...list])
              setFiltered(list => [mapped, ...list])
            }
          }
          setShowAchievementDialog(false)
          setEditing(null)
        }}
      />
    </div>
  );
}
