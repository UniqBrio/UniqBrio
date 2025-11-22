// Utility helpers for consistent CRUD toasts
// Usage: import { crudSuccess, crudError } from '@/lib/dashboard/staff/crud-toast'
// crudSuccess('leave request', 'deleted')

import { toast } from '@/hooks/dashboard/use-toast'

export function crudSuccess(entity: string, action: string, opts?: { description?: string }) {
  toast({
    title: capitalize(entity) + ' ' + action,
    description: opts?.description || `The ${entity} was successfully ${action}.`,
  })
}

export function crudError(entity: string, action: string, error?: unknown) {
  toast({
    title: `Failed to ${action} ${entity}`,
    description: (error instanceof Error ? error.message : 'Please try again later.'),
  })
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
