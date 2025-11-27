// API utility functions for attendance management

export interface AttendanceRecord {
  _id?: string;
  id?: string;
  studentId: string;
  studentName: string;
  cohortId?: string;
  cohortName?: string;
  cohortInstructor?: string;
  cohortTiming?: string;
  courseId?: string;
  courseName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: 'present' | 'absent';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceDraft {
  _id?: string;
  id?: string;
  studentId?: string;
  studentName?: string;
  cohortId?: string;
  cohortName?: string;
  cohortInstructor?: string;
  cohortTiming?: string;
  courseId?: string;
  courseName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status?: 'present' | 'absent';
  notes?: string;
  savedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Attendance Records API
export const attendanceAPI = {
  // Get all attendance records
  async getAll(params?: {
    studentId?: string;
    cohortId?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`/api/dashboard/student/attendance?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch attendance records');
    }
    return response.json();
  },

  // Get single attendance record
  async getById(id: string) {
    const response = await fetch(`/api/dashboard/student/attendance/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch attendance record');
    }
    return response.json();
  },

  // Create new attendance record
  async create(data: Partial<AttendanceRecord>) {
    const response = await fetch('/api/dashboard/student/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create attendance record');
    }
    return response.json();
  },

  // Update attendance record
  async update(id: string, data: Partial<AttendanceRecord>) {
    const response = await fetch(`/api/dashboard/student/attendance/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update attendance record');
    }
    return response.json();
  },

  // Delete attendance record
  async delete(id: string) {
    const response = await fetch(`/api/dashboard/student/attendance/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete attendance record');
    }
    return response.json();
  },
};

// Attendance Drafts API
export const attendanceDraftsAPI = {
  // Get all drafts
  async getAll(params?: {
    studentId?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`/api/dashboard/student/attendance-drafts?${searchParams}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch attendance drafts');
    }
    return response.json();
  },

  // Get single draft
  async getById(id: string) {
    const response = await fetch(`/api/dashboard/student/attendance-drafts/${id}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch attendance draft');
    }
    return response.json();
  },

  // Create new draft
  async create(data: Partial<AttendanceDraft>) {
    const response = await fetch('/api/dashboard/student/attendance-drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create attendance draft');
    }
    return response.json();
  },

  // Update draft
  async update(id: string, data: Partial<AttendanceDraft>) {
    const response = await fetch(`/api/dashboard/student/attendance-drafts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update attendance draft');
    }
    return response.json();
  },

  // Delete draft
  async delete(id: string) {
    const response = await fetch(`/api/dashboard/student/attendance-drafts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete attendance draft');
    }
    return response.json();
  },

  // Delete all drafts
  async deleteAll() {
    const response = await fetch('/api/dashboard/student/attendance-drafts?deleteAll=true', {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete all drafts');
    }
    return response.json();
  },
};
