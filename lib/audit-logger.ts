import AuditLogModel, { AuditAction, AuditModule, IFieldChange } from '@/models/AuditLog';
import { dbConnect } from '@/lib/mongodb';

export interface CreateAuditLogParams {
  tenantId: string;
  module: AuditModule | string;
  action: AuditAction | string;
  changedBy: string;
  changedById: string;
  role: string;
  ipAddress?: string;
  userAgent?: string;
  previousValue?: string | null;
  currentValue?: string | null;
  fieldChanges?: IFieldChange[];
  metadata?: {
    sessionId?: string;
    requestId?: string;
    [key: string]: any;
  };
  additionalDetails?: Record<string, any>;
}

/**
 * Creates an audit log entry in the database
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  'use server';
  try {
    await dbConnect();

    const auditLog = new AuditLogModel({
      tenantId: params.tenantId || 'default',
      module: params.module,
      action: params.action,
      timestamp: new Date(),
      previousValue: params.previousValue,
      currentValue: params.currentValue,
      changedBy: params.changedBy,
      changedById: params.changedById,
      role: params.role,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: {
        fieldChanges: params.fieldChanges,
        metadata: params.metadata,
        ...params.additionalDetails,
      },
    });

    await auditLog.save();
    console.log(`[AuditLog] Created: ${params.action} in ${params.module} by ${params.changedBy}`);
  } catch (error) {
    console.error('[AuditLog] Error creating audit log:', error);
    // Don't throw - audit log failures shouldn't break the main application flow
  }
}

/**
 * Creates an audit log for authentication events (login/logout)
 */
export async function logAuthEvent(
  action: 'Login' | 'Logout',
  userId: string,
  userName: string,
  userEmail: string,
  role: string,
  tenantId: string,
  ipAddress?: string,
  userAgent?: string,
  sessionId?: string
): Promise<void> {
  'use server';
  await createAuditLog({
    tenantId,
    module: AuditModule.AUTHENTICATION,
    action,
    changedBy: userName || userEmail,
    changedById: userId,
    role,
    ipAddress,
    userAgent,
    metadata: {
      sessionId,
      email: userEmail,
    },
  });
}

/**
 * Creates an audit log for entity updates with field changes
 */
export async function logEntityUpdate(
  module: AuditModule | string,
  entityId: string,
  entityName: string,
  fieldChanges: IFieldChange[],
  userId: string,
  userName: string,
  role: string,
  tenantId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  'use server';
  const previousValue = fieldChanges.map(fc => `${fc.field}: ${fc.oldValue}`).join(' | ');
  const currentValue = fieldChanges.map(fc => `${fc.field}: ${fc.newValue}`).join(' | ');

  await createAuditLog({
    tenantId,
    module,
    action: AuditAction.UPDATE,
    changedBy: userName,
    changedById: userId,
    role,
    ipAddress,
    userAgent,
    previousValue,
    currentValue,
    fieldChanges,
    additionalDetails: {
      entityId,
      entityName,
    },
  });
}

/**
 * Creates an audit log for entity creation
 */
export async function logEntityCreate(
  module: AuditModule | string,
  entityId: string,
  entityName: string,
  userId: string,
  userName: string,
  role: string,
  tenantId: string,
  ipAddress?: string,
  userAgent?: string,
  entityData?: Record<string, any>
): Promise<void> {
  'use server';
  await createAuditLog({
    tenantId,
    module,
    action: AuditAction.ADD,
    changedBy: userName,
    changedById: userId,
    role,
    ipAddress,
    userAgent,
    currentValue: JSON.stringify(entityData),
    additionalDetails: {
      entityId,
      entityName,
      entityData,
    },
  });
}

/**
 * Creates an audit log for entity deletion
 */
export async function logEntityDelete(
  module: AuditModule | string,
  entityId: string,
  entityName: string,
  userId: string,
  userName: string,
  role: string,
  tenantId: string,
  ipAddress?: string,
  userAgent?: string,
  entityData?: Record<string, any>
): Promise<void> {
  'use server';
  await createAuditLog({
    tenantId,
    module,
    action: AuditAction.DELETE,
    changedBy: userName,
    changedById: userId,
    role,
    ipAddress,
    userAgent,
    previousValue: JSON.stringify(entityData),
    additionalDetails: {
      entityId,
      entityName,
      entityData,
    },
  });
}

/**
 * Helper to extract IP address from request headers
 */
export function getClientIp(headers: Headers): string | undefined {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    undefined
  );
}

/**
 * Helper to get user agent from request headers
 */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get('user-agent') || undefined;
}
