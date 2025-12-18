import AdminPaymentRecordModel from "@/models/AdminPaymentRecord";

/**
 * Get the current active payment record for an academy
 */
export async function getActivePaymentRecord(academyId: string) {
  return await AdminPaymentRecordModel.findOne({
    academyId,
    status: "paid",
    planStatus: "active",
  }).sort({ endDate: -1 });
}

/**
 * Get upcoming payment records
 */
export async function getUpcomingPaymentRecords(academyId: string) {
  return await AdminPaymentRecordModel.find({
    academyId,
    planStatus: "upcoming",
  }).sort({ startDate: 1 });
}

/**
 * Get expired payment records
 */
export async function getExpiredPaymentRecords(academyId: string) {
  return await AdminPaymentRecordModel.find({
    academyId,
    planStatus: "expired",
  }).sort({ endDate: -1 });
}

/**
 * Get overdue payments (expired but still pending payment)
 */
export async function getOverduePayments(academyId: string) {
  return await AdminPaymentRecordModel.find({
    academyId,
    isOverdue: true,
  }).sort({ endDate: 1 });
}

/**
 * Suggest upgrade plans based on current plan
 */
export function suggestUpgradePlan(currentPlan: string): string[] {
  const planHierarchy = ["free", "beta", "scale", "grow"];
  const currentIndex = planHierarchy.indexOf(currentPlan?.toLowerCase());
  
  if (currentIndex === -1 || currentIndex === planHierarchy.length - 1) {
    return [];
  }
  
  return planHierarchy.slice(currentIndex + 1);
}

/**
 * Bulk update all payment records to recalculate plan status
 * Run this periodically (e.g., daily cron job)
 */
export async function updateAllPaymentStatuses() {
  const payments = await AdminPaymentRecordModel.find({});
  
  const updates = payments.map(async (payment) => {
    return payment.updatePlanStatus();
  });
  
  await Promise.all(updates);
  
  return { updated: payments.length };
}

/**
 * Calculate plan status badge info for UI
 */
export function getPlanStatusBadge(planStatus: string, daysRemaining: number) {
  switch (planStatus) {
    case "active":
      if (daysRemaining <= 3) {
        return {
          text: "Active (Expiring Soon)",
          className: "bg-orange-100 text-orange-800 border-orange-200",
        };
      }
      return {
        text: "Active",
        className: "bg-green-100 text-green-800 border-green-200",
      };
    case "upcoming":
      return {
        text: "Upcoming",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      };
    case "expired":
      return {
        text: "Expired",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      };
    default:
      return {
        text: "Unknown",
        className: "bg-gray-100 text-gray-600 border-gray-200",
      };
  }
}

/**
 * Calculate payment status badge info for UI
 */
export function getPaymentStatusBadge(status: string, isOverdue: boolean) {
  if (isOverdue) {
    return {
      text: "Overdue",
      className: "bg-red-100 text-red-800 border-red-200",
    };
  }
  
  switch (status) {
    case "paid":
      return {
        text: "Paid",
        className: "bg-green-100 text-green-800 border-green-200",
      };
    case "pending":
      return {
        text: "Pending",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    default:
      return {
        text: "Unknown",
        className: "bg-gray-100 text-gray-600 border-gray-200",
      };
  }
}
