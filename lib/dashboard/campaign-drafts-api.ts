"use client";

export type CampaignDraftStatus = "Active" | "Scheduled" | "Completed" | "Draft";
export type CampaignDraftType = "Marketing" | "Contest" | "Certificate" | "Design" | "Media" | "Special";

export interface CampaignDraftData {
  id: string;
  title: string;
  type: CampaignDraftType;
  description: string;
  startDate: string;
  endDate: string;
  status: CampaignDraftStatus;
  reach: number;
  engagement: number;
  conversions: number;
  roi: number;
  featured: boolean;
  createdAt: string;
}


export interface CampaignDraft {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: CampaignDraftData;
}

interface TaskDraftResponse {
  id: string;
  title: string;
  data: CampaignDraftData;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface DraftsPayload {
  success?: boolean;
  data?: TaskDraftResponse[];
  message?: string;
  id?: string;
}

const BASE_URL = "/api/dashboard/task-management/task-drafts";
const DRAFT_TYPE = "campaign";

async function handleResponse(res: Response) {
  const payload: DraftsPayload = await res.json();
  if (!res.ok || payload.success === false) {
    throw new Error(payload.message || res.statusText || "Failed to process campaign draft request");
  }
  return payload;
}

function mapToCampaignDraft(draft: TaskDraftResponse): CampaignDraft {
  const fallbackName = draft?.data?.title || draft.title || "Untitled Campaign";
  return {
    id: draft.id,
    name: fallbackName,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    data: {
      ...draft.data,
      id: draft.data?.id || draft.id,
      title: draft.data?.title || fallbackName,
      createdAt: draft.data?.createdAt || draft.createdAt,
    },
  };
}

export class CampaignDraftsAPI {
  static async getAllDrafts(): Promise<CampaignDraft[]> {
    const res = await fetch(`${BASE_URL}?type=${DRAFT_TYPE}`, {
      cache: "no-store",
    });
    const payload = await handleResponse(res);
    const drafts = payload.data ?? [];
    return drafts.map(mapToCampaignDraft);
  }

  static async createDraft(data: CampaignDraftData, name?: string): Promise<CampaignDraft> {
    const draftName = name || this.generateDraftName(data);
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: draftName,
        data,
        type: DRAFT_TYPE,
      }),
    });

    const payload = await handleResponse(res);
    const now = new Date().toISOString();
    return {
      id: payload.id!,
      name: draftName,
      createdAt: now,
      updatedAt: now,
      data,
    };
  }

  static async updateDraft(id: string, data: CampaignDraftData, name?: string): Promise<CampaignDraft> {
    const draftName = name || this.generateDraftName(data);
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: draftName,
        data,
        type: DRAFT_TYPE,
      }),
    });
    await handleResponse(res);
    const now = new Date().toISOString();
    return {
      id,
      name: draftName,
      createdAt: now,
      updatedAt: now,
      data,
    };
  }

  static async deleteDraft(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
    await handleResponse(res);
  }

  static generateDraftName(data: CampaignDraftData): string {
    const parts: string[] = [];
    if (data.title) parts.push(data.title);
    if (data.type) parts.push(data.type);
    if (data.status) parts.push(data.status);
    return parts.length ? parts.join(" · ") : "Untitled Campaign";
  }
}
