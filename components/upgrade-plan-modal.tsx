"use client"

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/dashboard/ui/dialog';
import { Button } from '@/components/dashboard/ui/button';
import { Crown, Lock } from 'lucide-react';
import Link from 'next/link';

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: 'payments' | 'attendance' | 'courses' | 'schedules';
}

export function UpgradePlanModal({ open, onOpenChange, module }: UpgradePlanModalProps) {
  const title = module ? `${module[0].toUpperCase()}${module.slice(1)} is read-only` : 'Upgrade required';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-purple-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Lock className="w-5 h-5 text-purple-600" /> {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-white">
            You are on the Free plan with more than 14 students. Write actions are disabled. Upgrade your plan to continue creating or editing here.
          </p>
          <div className="flex gap-2">
            <Link href="/dashboard/settings/subscription" className="w-full">
              <Button className="w-full bg-gradient-to-r from-[#DE7D14] to-[#8B5CF6] text-white">
                <Crown className="w-4 h-4 mr-2" /> Upgrade Plan
              </Button>
            </Link>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">Close</Button>
          </div>
          <div className="text-xs text-gray-500 dark:text-white">
            Tip: You can still view data across Payments, Attendance, Courses, and Schedules.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
