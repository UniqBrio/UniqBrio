"use client";

import { useState, useEffect, useCallback } from "react";

export interface UpiProviderOption {
  value: string;
  label: string;
  isCustom: boolean;
}

const DEFAULT_UPI_PROVIDERS: UpiProviderOption[] = [
  { value: "gpay", label: "Google Pay (GPay)", isCustom: false },
  { value: "phonepe", label: "PhonePe", isCustom: false },
  { value: "paytm", label: "Paytm", isCustom: false },
  { value: "amazonpay", label: "Amazon Pay", isCustom: false },
  { value: "bhim", label: "BHIM", isCustom: false },
];

export function useCustomUpiProviders() {
  const [customProviders, setCustomProviders] = useState<UpiProviderOption[]>([]);
  const [loading, setLoading] = useState(false);

  const getIsNI = () => {
    try {
      const w: any = typeof window !== "undefined" ? window : undefined;
      if (!w) return false;
      if (w.__NI_SCOPE === true) return true;
      if (w.__LEAVE_SCOPE === "non-instructor") return true;
      if (typeof w.location?.pathname === "string" && w.location.pathname.includes("non-instructor")) return true;
    } catch {}
    return false;
  };

  const fetchCustomProviders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(getIsNI() ? "/api/dashboard/staff/non-instructor/upi-providers" : "/api/dashboard/staff/instructor/upi-providers");
      if (response.ok) {
        const data = await response.json();
        const setDefaults = DEFAULT_UPI_PROVIDERS.map(p => p.label);
        const providers = ((data.upiProviders as string[] | undefined) ?? [])
          // Hide any legacy/custom "Other" entries (case-insensitive)
          .filter((p) => String(p).trim().toLowerCase() !== "other");
        // Build unique set of customs after excluding defaults
        const customs = Array.from(
          new Set(
            providers
              .filter((p) => p && !setDefaults.some(lbl => lbl.toLowerCase() === String(p).toLowerCase()))
              .map(String)
          )
        ).map((p) => ({ value: p, label: p, isCustom: true }));
        setCustomProviders(customs);
      } else {
        console.error("Failed to fetch UPI providers:", response.statusText);
        loadFromLocalStorage();
      }
    } catch (e) {
      console.error("Error fetching UPI providers:", e);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("customUpiProviders");
      if (stored) {
        const parsed: UpiProviderOption[] = JSON.parse(stored);
        // Drop any entry named "Other"
        const filtered = parsed.filter(p => String(p.label).trim().toLowerCase() !== "other");
        setCustomProviders(filtered);
      }
    } catch (e) {
      console.error("Error loading custom UPI providers from localStorage:", e);
    }
  };

  const saveToLocalStorage = (arr: UpiProviderOption[]) => {
    try {
      localStorage.setItem("customUpiProviders", JSON.stringify(arr));
    } catch (e) {
      console.error("Error saving custom UPI providers to localStorage:", e);
    }
  };

  const getAllProviders = useCallback((): UpiProviderOption[] => {
    // Ensure "Other" never surfaces in UI even if present in memory accidentally
    const filterOther = (arr: UpiProviderOption[]) => arr.filter(p => String(p.label).trim().toLowerCase() !== "other");
    return [...DEFAULT_UPI_PROVIDERS, ...filterOther(customProviders)];
  }, [customProviders]);

  const addCustomProvider = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (trimmed.toLowerCase() === "other") return false; // disallow adding "Other"

    const all = getAllProviders();
    if (all.some(p => p.label.toLowerCase() === trimmed.toLowerCase())) return false;

    const next = [...customProviders, { value: trimmed, label: trimmed, isCustom: true }];
    setCustomProviders(next);
    saveToLocalStorage(next);

    try {
      const res = await fetch(getIsNI() ? "/api/dashboard/staff/non-instructor/upi-providers" : "/api/dashboard/staff/instructor/upi-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customUpiProviders: next.map(p => p.value) }),
      });
      if (!res.ok) console.error("Failed to persist UPI providers; kept locally");
    } catch (e) {
      console.error("Error persisting UPI providers:", e);
    }

    return true;
  }, [customProviders, getAllProviders]);

  useEffect(() => { fetchCustomProviders(); }, [fetchCustomProviders]);

  // Refresh when instructors/non-instructors list changes in this tab (same-session add)
  useEffect(() => {
    const handler = () => {
      // slight debounce to allow DB write to complete
      setTimeout(() => { fetchCustomProviders().catch(() => undefined) }, 200);
    };
    try {
      window.addEventListener('non-instructors-sync', handler as EventListener);
      window.addEventListener('instructors-sync', handler as EventListener);
      window.addEventListener('instructorUpdated', handler as EventListener);
    } catch {}
    return () => {
      try {
        window.removeEventListener('non-instructors-sync', handler as EventListener);
        window.removeEventListener('instructors-sync', handler as EventListener);
        window.removeEventListener('instructorUpdated', handler as EventListener);
      } catch {}
    };
  }, [fetchCustomProviders]);

  return { customProviders, getAllProviders, addCustomProvider, loading, refresh: fetchCustomProviders };
}
