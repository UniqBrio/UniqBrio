"use client";

import { useState, useEffect, useCallback } from "react";

export interface LeaveTypeOption {
  value: string;
  label: string;
  isCustom?: boolean;
}

const DEFAULT_LEAVE_TYPES: LeaveTypeOption[] = [
  { value: "Leave without pay", label: "Leave without pay" },
  { value: "Sick Leave", label: "Sick Leave" },
  { value: "Emergency Leave", label: "Emergency Leave" },
  { value: "Planned Leave", label: "Planned Leave" },
  { value: "Maternity Leave", label: "Maternity Leave" },
  { value: "Paternity Leave", label: "Paternity Leave" },
];

const STORAGE_KEY = "custom-leave-types";

export function useCustomLeaveTypes() {
  const [customLeaveTypes, setCustomLeaveTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Detect Non-Instructor scope: prefer explicit flags, fallback to URL path
  const isNIContext = () => {
    try {
      const w: any = typeof window !== 'undefined' ? window : undefined
      if (!w) return false
      if (w.__NI_SCOPE === true) return true
      if (w.__LEAVE_SCOPE === 'non-instructor') return true
      if (typeof w.location?.pathname === 'string' && w.location.pathname.includes('non-instructor')) return true
    } catch {}
    return false
  }

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[] | { label: string }[];
        const arr = Array.isArray(parsed)
          ? parsed.map((x: any) => (typeof x === "string" ? x : x.label))
          : [];
        setCustomLeaveTypes(arr);
      }
    } catch (e) {
      console.error("Failed to load custom leave types from localStorage", e);
    }
  };

  const saveToLocalStorage = (types: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
    } catch (e) {
      console.error("Failed to save custom leave types to localStorage", e);
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(isNIContext() ? "/api/dashboard/staff/non-instructor/leave-types" : "/api/dashboard/staff/instructor/leave-types");
      if (res.ok) {
        const data = await res.json();
        // Remove deprecated/hidden types like "Casual Leave"
        const types: string[] = (data.leaveTypes || [])
          .filter((t: string) => !!t)
          .filter((t: string) => t.toLowerCase() !== "casual leave".toLowerCase());
        // Filter out defaults to get only truly custom labels
        const defaults = new Set(DEFAULT_LEAVE_TYPES.map((d) => d.value.toLowerCase()));
        const customs = types.filter((t) => !defaults.has(String(t).toLowerCase()));
        setCustomLeaveTypes(customs);
        saveToLocalStorage(customs);
      } else {
        console.warn("/api/leave-types failed; using localStorage fallback");
        loadFromLocalStorage();
      }
    } catch (e) {
      console.error("Error loading leave types", e);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getAllLeaveTypes = useCallback((): LeaveTypeOption[] => {
    const customs: LeaveTypeOption[] = customLeaveTypes.map((t) => ({
      value: t,
      label: t,
      isCustom: true,
    }));
    // Ensure removed types like "Casual Leave" never surface
    const removed = new Set(["casual leave"]);
    const filterOut = (opt: LeaveTypeOption) => !removed.has(opt.value.toLowerCase());
    return [...DEFAULT_LEAVE_TYPES, ...customs].filter(filterOut);
  }, [customLeaveTypes]);

  const addCustomLeaveType = useCallback(async (label: string): Promise<string | null> => {
    const trimmed = label.trim();
    if (!trimmed) return null;

    const all = getAllLeaveTypes();
    if (all.some((t) => t.label.toLowerCase() === trimmed.toLowerCase())) {
      return trimmed; // already exists; treat as success
    }

    // Optimistic update
    const next = [...customLeaveTypes, trimmed];
    setCustomLeaveTypes(next);
    saveToLocalStorage(next);

    try {
      // Sync to backend (like roles hook); actual persistence happens when a leave is created with this type
      await fetch(isNIContext() ? "/api/dashboard/staff/non-instructor/leave-types" : "/api/dashboard/staff/instructor/leave-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customLeaveTypes: next }),
      });
    } catch (e) {
      console.warn("Failed to sync custom leave types; staying local only", e);
    }

    return trimmed;
  }, [customLeaveTypes, getAllLeaveTypes]);

  const deleteCustomLeaveType = useCallback(async (value: string) => {
    // Optional, not required by current flow; keep for parity
    const next = customLeaveTypes.filter((t) => t !== value);
    setCustomLeaveTypes(next);
    saveToLocalStorage(next);
    try {
      await fetch(isNIContext() ? "/api/dashboard/staff/non-instructor/leave-types" : "/api/dashboard/staff/instructor/leave-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customLeaveTypes: next }),
      });
    } catch (e) {
      console.warn("Failed to sync after delete", e);
    }
  }, [customLeaveTypes]);

  return {
    loading,
    getAllLeaveTypes,
    addCustomLeaveType,
    deleteCustomLeaveType,
    refresh,
  };
}
