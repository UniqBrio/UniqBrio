// Centralized CRUD toast helpers
// Usage: import { crudSuccess, crudError } from '@/lib/dashboard/crud-toast'
// Example: crudSuccess('task', 'added')

import { toast } from '@/components/dashboard/ui/use-toast'

interface CrudSuccessOptions {
  description?: string
  actionLabel?: string
  onAction?: () => void
  variant?: 'default' | 'destructive'
}

export function crudSuccess(entity: string, action: string, opts: CrudSuccessOptions = {}) {
  const title = `${capitalize(entity)} ${pastTense(action)}`
  toast({
    title,
    description: opts.description || defaultSuccessDescription(entity, action),
    variant: opts.variant || 'default',
  })
}

interface CrudErrorOptions {
  description?: string
  error?: unknown
}

export function crudError(entity: string, action: string, opts: CrudErrorOptions = {}) {
  const base = `${capitalize(action)} ${entity}`
  toast({
    title: `Failed to ${action} ${entity}`,
    description: opts.description || extractError(opts.error) || `We couldn't ${action} the ${entity}. Please try again.`,
    variant: 'destructive',
  })
}

function defaultSuccessDescription(entity: string, action: string) {
  return `The ${entity} was successfully ${pastTense(action)}.`
}

function pastTense(action: string) {
  // Simple mapping; extend as needed
  const lower = action.toLowerCase()
  switch (lower) {
    case 'add': return 'added'
    case 'create': return 'created'
    case 'update': return 'updated'
    case 'edit': return 'updated'
    case 'delete': return 'deleted'
    case 'save': return 'saved'
    case 'archive': return 'archived'
    case 'restore': return 'restored'
    case 'import': return 'imported'
    case 'complete': return 'completed'
    case 'reopen': return 'reopened'
    case 'clear': return 'cleared'
    default: return lower
  }
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function extractError(err: unknown): string | undefined {
  if (!err) return undefined
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try { return JSON.stringify(err) } catch { return undefined }
}
