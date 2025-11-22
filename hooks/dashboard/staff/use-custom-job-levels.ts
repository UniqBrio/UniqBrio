"use client";

import { useState, useEffect, useCallback } from 'react';

// Define the job level option type
export interface JobLevelOption {
  value: string;
  label: string;
  isCustom: boolean;
}

// Default job levels that should always be available
// Keep Instructor defaults unchanged
const DEFAULT_INSTRUCTOR_JOB_LEVELS: JobLevelOption[] = [
  { value: 'Senior Staff', label: 'Senior Staff', isCustom: false },
  { value: 'Junior Staff', label: 'Junior Staff', isCustom: false },
  { value: 'Team Lead', label: 'Team Lead', isCustom: false },
  { value: 'Manager', label: 'Manager', isCustom: false },
]

// Non-Instructor defaults: replace Team Lead with Supervisor
const DEFAULT_NON_INSTRUCTOR_JOB_LEVELS: JobLevelOption[] = [
  { value: 'Senior Staff', label: 'Senior Staff', isCustom: false },
  { value: 'Junior Staff', label: 'Junior Staff', isCustom: false },
  { value: 'Supervisor', label: 'Supervisor', isCustom: false },
  { value: 'Manager', label: 'Manager', isCustom: false },
]

export function useCustomJobLevels() {
  const [customJobLevels, setCustomJobLevels] = useState<JobLevelOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to detect non-instructor scope
  const getIsNI = () => {
    try {
      const w: any = typeof window !== 'undefined' ? window : undefined
      if (!w) return false
      if (w.__NI_SCOPE === true) return true
      if (w.__LEAVE_SCOPE === 'non-instructor') return true
      if (typeof w.location?.pathname === 'string' && w.location.pathname.includes('non-instructor')) return true
    } catch {}
    return false
  }

  // Fetch custom job levels from the backend
  const fetchCustomJobLevels = useCallback(async () => {
    setLoading(true);
    try {
  const response = await fetch(getIsNI() ? '/api/dashboard/staff/non-instructor/job-levels' : '/api/dashboard/staff/instructor/job-levels');
      if (response.ok) {
        const data = await response.json();
        // Use the correct default set for current scope when filtering duplicates
        const defaults = getIsNI() ? DEFAULT_NON_INSTRUCTOR_JOB_LEVELS : DEFAULT_INSTRUCTOR_JOB_LEVELS
        const customLevels = data.jobLevels
          .filter((level: string) => !defaults.some(def => def.value === level))
          .map((level: string) => ({
            value: level,
            label: level,
            isCustom: true
          }));
        setCustomJobLevels(customLevels);
      } else {
        console.error('Failed to fetch job levels:', response.statusText);
        // Fallback to localStorage if API fails
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error fetching job levels:', error);
      // Fallback to localStorage if API fails
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, []);

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('customJobLevels');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomJobLevels(parsed);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  // Save to localStorage as backup
  const saveToLocalStorage = (levels: JobLevelOption[]) => {
    try {
      localStorage.setItem('customJobLevels', JSON.stringify(levels));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Get all job levels (default + custom)
  const getAllJobLevels = useCallback((): JobLevelOption[] => {
    const defaults = getIsNI() ? DEFAULT_NON_INSTRUCTOR_JOB_LEVELS : DEFAULT_INSTRUCTOR_JOB_LEVELS
    return [...defaults, ...customJobLevels];
  }, [customJobLevels]);

  // Add a new custom job level
  const addCustomJobLevel = useCallback(async (newLevel: string) => {
    const trimmedLevel = newLevel.trim();
    if (!trimmedLevel) return false;

    // Check if it already exists
    const allLevels = getAllJobLevels();
    if (allLevels.some(level => level.label.toLowerCase() === trimmedLevel.toLowerCase())) {
      return false;
    }

    const newJobLevelOption: JobLevelOption = {
      value: trimmedLevel,
      label: trimmedLevel,
      isCustom: true
    };

    const updatedCustomLevels = [...customJobLevels, newJobLevelOption];
    setCustomJobLevels(updatedCustomLevels);
    saveToLocalStorage(updatedCustomLevels);

    // Update backend
    try {
  const response = await fetch(getIsNI() ? '/api/dashboard/staff/non-instructor/job-levels' : '/api/dashboard/staff/instructor/job-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customJobLevels: updatedCustomLevels.map(level => level.value)
        }),
      });

      if (!response.ok) {
        console.error('Failed to save to backend, but saved locally');
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
    }

    return true;
  }, [customJobLevels, getAllJobLevels]);

  // Delete a custom job level
  const deleteCustomJobLevel = useCallback(async (levelToDelete: string) => {
    try {
    // Check if the job level is being used by any instructors
  const checkResponse = await fetch(`${getIsNI() ? '/api/dashboard/staff/non-instructor/job-levels' : '/api/dashboard/staff/instructor/job-levels'}?check=${encodeURIComponent(levelToDelete)}`);
      if (checkResponse.ok) {
        const { isUsed, count } = await checkResponse.json();
        if (isUsed) {
          alert(`Cannot delete "${levelToDelete}" as it is currently used by ${count} instructor(s). Please update their job level first.`);
          return false;
        }
      }

      const updatedCustomLevels = customJobLevels.filter(level => level.value !== levelToDelete);
      setCustomJobLevels(updatedCustomLevels);
      saveToLocalStorage(updatedCustomLevels);

      // Update backend
  const response = await fetch(getIsNI() ? '/api/dashboard/staff/non-instructor/job-levels' : '/api/dashboard/staff/instructor/job-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customJobLevels: updatedCustomLevels.map(level => level.value)
        }),
      });

      if (!response.ok) {
        console.error('Failed to update backend, but deleted locally');
      }

      return true;
    } catch (error) {
      console.error('Error deleting job level:', error);
      return false;
    }
  }, [customJobLevels]);

  // Listen for instructor updates to refresh job levels
  useEffect(() => {
    const handleInstructorUpdate = () => {
      fetchCustomJobLevels();
    };

    // Listen for custom events when instructors are updated
    window.addEventListener('instructorUpdated', handleInstructorUpdate);
    
    return () => {
      window.removeEventListener('instructorUpdated', handleInstructorUpdate);
    };
  }, [fetchCustomJobLevels]);

  // Initial load
  useEffect(() => {
    fetchCustomJobLevels();
  }, [fetchCustomJobLevels]);

  return {
    customJobLevels,
    getAllJobLevels,
    addCustomJobLevel,
    deleteCustomJobLevel,
    loading,
    refresh: fetchCustomJobLevels
  };
}
