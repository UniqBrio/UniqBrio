import { NextResponse } from 'next/server';
import AdminPaymentRecordModel, { IAdminPaymentRecord } from '@/models/AdminPaymentRecord';
import RegistrationModel from '@/models/Registration';
import StudentModel from '@/models/dashboard/student/Student';
import { dbConnect } from '@/lib/mongodb';

export type RestrictedModule = 'payments' | 'attendance' | 'courses' | 'schedules';

export interface RestrictionStatus {
  plan: string;
  studentCount: number;
  restricted: boolean;
  academyId?: string;
  createdAt?: string;
  daysSinceCreated?: number;
}

// Short TTL cache (in-memory) per tenant to avoid repeated counts on hot endpoints
const cache = new Map<string, { status: RestrictionStatus; expiresAt: number }>();
const TTL_MS = 120_000; // 2 minutes

async function resolveRegistrationByTenant(tenantId: string): Promise<{ academyId?: string; createdAt?: Date }> {
  // Registration documents carry tenantId -> academyId mapping and createdAt timestamp
  const reg = await RegistrationModel.findOne({ tenantId }).lean();
  return { academyId: reg?.academyId, createdAt: reg?.createdAt as any };
}

async function getActivePlanByAcademy(academyId?: string): Promise<string> {
  if (!academyId) return 'free';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const active = await AdminPaymentRecordModel.findOne({
    academyId,
    status: 'paid',
    planStatus: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ endDate: -1 }).lean<IAdminPaymentRecord | null>();

  const planFromActive = (active as any)?.plan;
  if (planFromActive) return String(planFromActive).toLowerCase();

  // Default to free if nothing active
  return 'free';
}

async function getActiveStudentCount(tenantId: string): Promise<number> {
  // Count all non-deleted students for the tenant
  const count = await StudentModel.countDocuments({ tenantId, isDeleted: { $ne: true } });
  return count ?? 0;
}

export async function getRestrictionStatus(tenantId: string): Promise<RestrictionStatus> {
  await dbConnect('uniqbrio');
  const now = Date.now();
  const hit = cache.get(tenantId);
  if (hit && hit.expiresAt > now) return hit.status;

  const { academyId, createdAt } = await resolveRegistrationByTenant(tenantId);
  const plan = await getActivePlanByAcademy(academyId);
  const studentCount = await getActiveStudentCount(tenantId);
  // Grace policy: If account age < 14 days, do not restrict even if over the 7-student limit on Free plan
  const daysSinceCreated = createdAt ? Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))) : undefined;
  const inGrace = typeof daysSinceCreated === 'number' ? daysSinceCreated < 14 : false;
  const restricted = plan === 'free' && studentCount > 14 && !inGrace;

  const status: RestrictionStatus = { plan, studentCount, restricted, academyId, createdAt: createdAt ? new Date(createdAt).toISOString() : undefined, daysSinceCreated };
  cache.set(tenantId, { status, expiresAt: now + TTL_MS });
  return status;
}

export function shouldBlockWrite(module: RestrictedModule, restricted: boolean, action: 'read' | 'write') {
  if (!restricted) return false;
  const restrictedModules: RestrictedModule[] = ['payments', 'attendance', 'courses', 'schedules'];
  return action === 'write' && restrictedModules.includes(module);
}

export async function assertWriteAllowed(tenantId: string, module: RestrictedModule) {
  const status = await getRestrictionStatus(tenantId);
  if (shouldBlockWrite(module, status.restricted, 'write')) {
    return NextResponse.json(
      {
        success: false,
        code: 'PLAN_RESTRICTION',
        message: 'Write operations are disabled on Free plan when there are more than 7 students. Please upgrade to continue.',
        details: { plan: status.plan, studentCount: status.studentCount, module },
      },
      { status: 403 }
    );
  }
  return null;
}
