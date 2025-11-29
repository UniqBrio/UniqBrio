"use client";

import { ExpenseFormData } from "@/components/dashboard/financials/types";

export interface ExpenseDraft {
  id: string;
  name: string;
  category: string;
  amount: string;
  lastUpdated: string;
  data: ExpenseFormData;
}

export class ExpenseDraftsAPI {
  private static readonly BASE_URL = '/api/dashboard/financial/expensedrafts';

  // Create a new expense draft
  static async createDraft(draftData: Omit<ExpenseDraft, 'id' | 'lastUpdated'>): Promise<ExpenseDraft> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(draftData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create expense draft: ${response.statusText}`);
    }

    return response.json();
  }

  // Get all expense drafts
  static async getAllDrafts(): Promise<ExpenseDraft[]> {
    const response = await fetch(this.BASE_URL, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch expense drafts: ${response.statusText}`);
    }

    return response.json();
  }

  // Update an existing expense draft
  static async updateDraft(id: string, draftData: Omit<ExpenseDraft, 'id' | 'lastUpdated'>): Promise<ExpenseDraft> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(draftData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update expense draft: ${response.statusText}`);
    }

    return response.json();
  }

  // Delete an expense draft
  static async deleteDraft(id: string): Promise<void> {
    const response = await fetch(`${this.BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete expense draft: ${response.statusText}`);
    }
  }

  // Generate a draft name based on form data
  static generateDraftName(data: ExpenseFormData): string {
    const parts: string[] = [];
    
    if (data.expenseCategory) parts.push(data.expenseCategory);
    if (data.amount) parts.push(`${data.amount}`);
    if (data.vendorName) parts.push(data.vendorName);
    
    if (parts.length === 0) return 'Untitled Expense';
    return parts.join(' - ');
  }

  // Trigger custom event for draft updates
  static triggerDraftsUpdatedEvent(drafts: ExpenseDraft[], action: 'created' | 'updated' | 'deleted' | 'converted' | 'migrated') {
    const event = new CustomEvent('expense-drafts-updated', {
      detail: { drafts, action }
    });
    window.dispatchEvent(event);
  }
}