"use client";

import { IncomeFormData } from "@/components/dashboard/financials/types";

export interface IncomeDraft {
  id: string;
  name: string;
  category: string;
  amount: string;
  lastUpdated: string;
  data: IncomeFormData;
}

export class IncomeDraftsAPI {
  private static readonly BASE_URL = '/api/dashboard/financial/incomedrafts';

  // Create a new income draft
  static async createDraft(draftData: Omit<IncomeDraft, 'id' | 'lastUpdated'>): Promise<IncomeDraft> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create income draft: ${response.statusText}`);
    }

    return response.json();
  }

  // Get all income drafts
  static async getAllDrafts(): Promise<IncomeDraft[]> {
    const response = await fetch(this.BASE_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch income drafts: ${response.statusText}`);
    }

    return response.json();
  }

  // Update an existing income draft
  static async updateDraft(id: string, draftData: Omit<IncomeDraft, 'id' | 'lastUpdated'>): Promise<IncomeDraft> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update income draft: ${response.statusText}`);
    }

    return response.json();
  }

  // Delete an income draft
  static async deleteDraft(id: string): Promise<void> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete income draft: ${response.statusText}`);
    }
  }

  // Generate a draft name based on form data
  static generateDraftName(data: IncomeFormData): string {
    const parts: string[] = [];
    
    if (data.incomeCategory) parts.push(data.incomeCategory);
    if (data.amount) parts.push(`${data.amount}`);
    if (data.sourceType) parts.push(data.sourceType);
    
    if (parts.length === 0) return 'Untitled Income';
    return parts.join(' - ');
  }

  // Trigger custom event for draft updates
  static triggerDraftsUpdatedEvent(drafts: IncomeDraft[], action: 'created' | 'updated' | 'deleted' | 'converted' | 'migrated') {
    const event = new CustomEvent('income-drafts-updated', {
      detail: { drafts, action }
    });
    window.dispatchEvent(event);
  }
}