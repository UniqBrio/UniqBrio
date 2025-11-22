/**
 * Events API utility functions
 * Provides helper methods for calling the events API endpoints
 */

const API_BASE = '/api/dashboard/events';

export interface EventResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Fetch all events with optional filters
 */
export async function fetchEvents(options?: {
  search?: string;
  sport?: string;
  status?: string;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}): Promise<EventResponse> {
  try {
    const params = new URLSearchParams();

    if (options?.search) params.append('search', options.search);
    if (options?.sport) params.append('sport', options.sport);
    if (options?.status) params.append('status', options.status);
    if (options?.isPublished !== undefined)
      params.append('isPublished', String(options.isPublished));
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));

    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch events',
    };
  }
}

/**
 * Fetch a single event by ID
 */
export async function fetchEventById(eventId: string): Promise<EventResponse> {
  try {
    const response = await fetch(`${API_BASE}/${eventId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching event:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch event',
    };
  }
}

/**
 * Create a new event
 */
export async function createEvent(eventData: any): Promise<EventResponse> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error creating event:', error);
    return {
      success: false,
      error: error.message || 'Failed to create event',
    };
  }
}

/**
 * Update an event
 */
export async function updateEvent(
  eventId: string,
  eventData: any
): Promise<EventResponse> {
  try {
    // Clean the data - remove fields that shouldn't be updated
    const cleanData = { ...eventData };
    delete cleanData.id; // Remove frontend id field
    delete cleanData._id; // Remove MongoDB _id if present
    delete cleanData.createdAt; // Don't update createdAt
    delete cleanData.updatedAt; // Don't update updatedAt
    delete cleanData.__v; // Remove MongoDB version key
    delete cleanData.status; // Status is computed, not stored
    delete cleanData.category; // Category is an alias for sport
    
    // Convert eventId to the correct field name if present
    if (!cleanData.eventId && eventId) {
      cleanData.eventId = eventId;
    }
    
    console.log('updateEvent API - Sending clean data:', cleanData);
    
    const response = await fetch(`${API_BASE}/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error updating event:', error);
    return {
      success: false,
      error: error.message || 'Failed to update event',
    };
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<EventResponse> {
  try {
    console.log('=== DELETE EVENT START ===');
    console.log('deleteEvent called with eventId:', eventId);
    
    const url = `${API_BASE}/${eventId}`;
    console.log('Calling DELETE endpoint:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
    });

    console.log('Delete response status:', response.status);
    console.log('Delete response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Delete error response:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Delete success result:', result);
    console.log('=== DELETE EVENT END (SUCCESS) ===');
    return result;
  } catch (error: any) {
    console.error('=== DELETE EVENT END (ERROR) ===');
    console.error('Error deleting event:', error);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: error.message || 'Failed to delete event',
    };
  }
}

/**
 * Publish an event
 */
export async function publishEvent(eventId: string): Promise<EventResponse> {
  try {
    const response = await fetch(`${API_BASE}/${eventId}/publish`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error publishing event:', error);
    return {
      success: false,
      error: error.message || 'Failed to publish event',
    };
  }
}

/**
 * Bulk delete events
 */
export async function bulkDeleteEvents(eventIds: string[]): Promise<EventResponse> {
  try {
    const response = await fetch(`${API_BASE}/bulk/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error bulk deleting events:', error);
    return {
      success: false,
      error: error.message || 'Failed to bulk delete events',
    };
  }
}

/**
 * Update participants count (inc/dec)
 */
export async function updateParticipants(eventId: string, action: 'inc' | 'dec', amount = 1): Promise<EventResponse> {
  try {
    const response = await fetch(`${API_BASE}/${eventId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, amount }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error: any) {
    console.error('Error updating participants:', error)
    return { success: false, error: error.message || 'Failed to update participants' }
  }
}

/**
 * Fetch event statistics
 */
export async function fetchEventStats(): Promise<EventResponse> {
  try {
    const response = await fetch(`${API_BASE}/stats/overview`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching event stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch statistics',
    };
  }
}
