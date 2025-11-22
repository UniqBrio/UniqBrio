export type AchievementType = 'individual' | 'group';

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  photoUrl?: string;
  createdAt: Date;
  likes: number;
  congratulations: number;
  shares: number;
  studentId: string;
}

export interface AchievementFormData {
  type: AchievementType;
  title: string;
  description: string;
  photo?: File;
}
