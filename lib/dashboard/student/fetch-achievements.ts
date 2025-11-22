// API utility for fetching achievements from the backend
export async function fetchAchievements() {
  const res = await fetch('/api/dashboard/student/achievements');
  if (!res.ok) throw new Error('Failed to fetch achievements');
  const data = await res.json();
  // Map backend fields to frontend Achievement type
  return data.map((a: any) => ({
    id: a._id || a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    photoUrl: a.photoUrl,
    createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
    likes: a.likes ?? 0,
    congratulations: a.congratulations ?? 0,
    shares: a.shares ?? 0,
    studentId: a.studentId || (typeof a.student === 'string' ? a.student : a.student?.id || a.student?._id || ''),
  }));
}
