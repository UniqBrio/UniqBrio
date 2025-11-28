import { type Student } from '@/types/dashboard/student';

export interface StudentDraft {
  id: string;
  name: string;
  instructor: string;
  level: string;
  lastUpdated: string;
  data: Partial<Student>;
}

export class StudentDraftsAPI {
  private static baseUrl = '/api/dashboard/student/student-drafts';

  static async getAllDrafts(): Promise<StudentDraft[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch student drafts:', error);
      throw error;
    }
  }

  static async createDraft(draftData: {
    name: string;
    instructor?: string;
    level?: string;
    data: Partial<Student>;
  }): Promise<StudentDraft> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create student draft:', error);
      throw error;
    }
  }

  static async updateDraft(
    id: string,
    draftData: {
      name?: string;
      instructor?: string;
      level?: string;
      data?: Partial<Student>;
    }
  ): Promise<StudentDraft> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, ...draftData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update student draft:', error);
      throw error;
    }
  }

  static async deleteDraft(id: string): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });

      // Handle 404 gracefully - if draft doesn't exist, deletion goal is achieved
      if (response.status === 404) {
        console.warn(`Draft ${id} not found (404) - already deleted or doesn't exist`);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete student draft:', error);
      throw error;
    }
  }

  // Utility method to trigger UI updates.
  // If `drafts` is not provided, attempt to fetch the latest drafts from the API
  // so listeners receive an authoritative list and can update counts immediately.
  static async triggerDraftsUpdatedEvent(drafts?: StudentDraft[], action?: string, draft?: StudentDraft) {
    let payloadDrafts = drafts;
    if (!Array.isArray(payloadDrafts)) {
      try {
        payloadDrafts = await StudentDraftsAPI.getAllDrafts();
      } catch (err) {
        // If fetching fails, leave drafts undefined — listeners should handle fallback
        console.warn('StudentDraftsAPI: failed to fetch drafts for event payload', err);
      }
    }

    window.dispatchEvent(
      new CustomEvent('student-drafts-updated', {
        detail: { drafts: payloadDrafts, action, draft },
      })
    );
  }
}