"use client";

import { useState, useEffect, useCallback } from 'react';

// Define the role option type
export interface RoleOption {
  value: string;
  label: string;
  isCustom: boolean;
  category?: string;
}

// Default roles organized by categories (Instructor scope)
const DEFAULT_INSTRUCTOR_ROLES: RoleOption[] = [
  { value: 'custom', label: 'Custom', isCustom: false },
  
  // Sports Instructors
  { value: 'Football Coach', label: 'Football Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Athletics (Track & Field) Coach', label: 'Athletics (Track & Field) Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Badminton Coach', label: 'Badminton Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Baseball Coach', label: 'Baseball Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Basketball Coach', label: 'Basketball Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Boxing / MMA Coach', label: 'Boxing / MMA Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Chess Coach', label: 'Chess Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Cricket Coach', label: 'Cricket Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Cycling Coach', label: 'Cycling Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Formula 1 / Motorsports Instructor', label: 'Formula 1 / Motorsports Instructor', isCustom: false, category: 'Sports Instructors' },
  { value: 'Golf Coach', label: 'Golf Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Ice Hockey Coach', label: 'Ice Hockey Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Kabaddi Coach', label: 'Kabaddi Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'MotoGP / Motorsports Instructor', label: 'MotoGP / Motorsports Instructor', isCustom: false, category: 'Sports Instructors' },
  { value: 'Rugby Coach', label: 'Rugby Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Skateboarding Instructor', label: 'Skateboarding Instructor', isCustom: false, category: 'Sports Instructors' },
  { value: 'Surfing Instructor', label: 'Surfing Instructor', isCustom: false, category: 'Sports Instructors' },
  { value: 'Swimming Coach', label: 'Swimming Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Table Tennis Coach', label: 'Table Tennis Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Tennis Coach', label: 'Tennis Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Volleyball Coach', label: 'Volleyball Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Wrestling Coach', label: 'Wrestling Coach', isCustom: false, category: 'Sports Instructors' },
  { value: 'Martial Arts Instructor', label: 'Martial Arts Instructor', isCustom: false, category: 'Sports Instructors' },

  // Arts Instructors
  { value: 'Applied Arts Instructor', label: 'Applied Arts Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Ceramics / Pottery Instructor', label: 'Ceramics / Pottery Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Contemporary Art Instructor', label: 'Contemporary Art Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Crafts Instructor', label: 'Crafts Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Cultural & Indigenous Arts Instructor', label: 'Cultural & Indigenous Arts Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Dance Instructor / Choreographer', label: 'Dance Instructor / Choreographer', isCustom: false, category: 'Arts Instructors' },
  { value: 'Digital Arts Instructor', label: 'Digital Arts Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Drawing Instructor', label: 'Drawing Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Film / Cinema Instructor', label: 'Film / Cinema Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Literary Arts / Creative Writing Instructor', label: 'Literary Arts / Creative Writing Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Music Instructor', label: 'Music Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Painting Instructor', label: 'Painting Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Performance Arts Instructor', label: 'Performance Arts Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Photography Instructor', label: 'Photography Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Printmaking Instructor', label: 'Printmaking Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Sculpture Instructor', label: 'Sculpture Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Street Art / Graffiti Instructor', label: 'Street Art / Graffiti Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Textile Arts Instructor', label: 'Textile Arts Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Theatre Instructor', label: 'Theatre Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Weaving & Tapestry Instructor', label: 'Weaving & Tapestry Instructor', isCustom: false, category: 'Arts Instructors' },
  { value: 'Quilting Instructor', label: 'Quilting Instructor', isCustom: false, category: 'Arts Instructors' },

  // Combined Roles
  { value: 'Senior Arts & Sports Instructor', label: 'Senior Arts & Sports Instructor', isCustom: false, category: 'Combined Roles' },
];

// Default roles for Non-Instructor scope, tailored for an arts & sports academy
const DEFAULT_NON_INSTRUCTOR_ROLES: RoleOption[] = [
  { value: 'custom', label: 'Custom', isCustom: false },
  // Facilities & Maintenance
  { value: 'Groundskeeper', label: 'Groundskeeper', isCustom: false, category: 'Facilities & Maintenance' },
  { value: 'Housekeeping Attendant', label: 'Housekeeping Attendant', isCustom: false, category: 'Facilities & Maintenance' },
  { value: 'Facilities Supervisor', label: 'Facilities Supervisor', isCustom: false, category: 'Facilities & Maintenance' },
  { value: 'Equipment Manager', label: 'Equipment Manager', isCustom: false, category: 'Facilities & Maintenance' },
  { value: 'Equipment Technician', label: 'Equipment Technician', isCustom: false, category: 'Facilities & Maintenance' },
  { value: 'Storekeeper', label: 'Storekeeper', isCustom: false, category: 'Facilities & Maintenance' },
  { value: 'Inventory Clerk', label: 'Inventory Clerk', isCustom: false, category: 'Facilities & Maintenance' },

  // Sports Support
  
  { value: 'Gym/Field Supervisor', label: 'Gym/Field Supervisor', isCustom: false, category: 'Sports Support' },
  { value: 'Locker Room Attendant', label: 'Locker Room Attendant', isCustom: false, category: 'Sports Support' },
  { value: 'Kit Manager', label: 'Kit Manager', isCustom: false, category: 'Sports Support' },
  { value: 'Lifeguard', label: 'Lifeguard', isCustom: false, category: 'Sports Support' },
  
  // Arts / Studios
  { value: 'Studio Technician (Music/Dance/Art)', label: 'Studio Technician (Music/Dance/Art)', isCustom: false, category: 'Arts & Studios' },
  { value: 'Rehearsal/Stage Technician', label: 'Rehearsal/Stage Technician', isCustom: false, category: 'Arts & Studios' },
  { value: 'Lighting Technician', label: 'Lighting Technician', isCustom: false, category: 'Arts & Studios' },
  { value: 'Sound/Audio Technician', label: 'Sound/Audio Technician', isCustom: false, category: 'Arts & Studios' },
  { value: 'Costume/Wardrobe Assistant', label: 'Costume/Wardrobe Assistant', isCustom: false, category: 'Arts & Studios' },
  { value: 'Props/Set Technician', label: 'Props/Set Technician', isCustom: false, category: 'Arts & Studios' },

  // Events & Front-of-House
  { value: 'Events Coordinator', label: 'Events Coordinator', isCustom: false, category: 'Events & Front-of-House' },
  { value: 'Front Desk Receptionist', label: 'Front Desk Receptionist', isCustom: false, category: 'Events & Front-of-House' },
  { value: 'Box Office Assistant', label: 'Box Office Assistant', isCustom: false, category: 'Events & Front-of-House' },
  
  // Admin & Student Services
  { value: 'Administrative Assistant', label: 'Administrative Assistant', isCustom: false, category: 'Admin & Student Services' },
  { value: 'Student Services Coordinator', label: 'Student Services Coordinator', isCustom: false, category: 'Admin & Student Services' },
  
  // Health, Safety & Ops
  { value: 'Health and Safety Officer', label: 'Health and Safety Officer', isCustom: false, category: 'Health, Safety & Ops' },
  { value: 'First Aid/Nurse Assistant', label: 'First Aid/Nurse Assistant', isCustom: false, category: 'Health, Safety & Ops' },
  { value: 'Security Guard', label: 'Security Guard', isCustom: false, category: 'Health, Safety & Ops' },

  // Transport & Hospitality
  { value: 'Transport/Bus Driver', label: 'Transport/Bus Driver', isCustom: false, category: 'Transport & Hospitality' },
  { value: 'Cafeteria/Cook', label: 'Cafeteria/Cook', isCustom: false, category: 'Transport & Hospitality' },
  { value: 'Hostel/Dorm Warden', label: 'Hostel/Dorm Warden', isCustom: false, category: 'Transport & Hospitality' },
];

export function useCustomRoles() {
  const [customRoles, setCustomRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Detect Non-Instructor scope using explicit flags or URL path
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

  // Fetch custom roles from the backend
  const fetchCustomRoles = useCallback(async () => {
    setLoading(true);
    try {
  const response = await fetch(getIsNI() ? '/api/dashboard/staff/non-instructor/roles' : '/api/dashboard/staff/instructor/roles');
      if (response.ok) {
        const data = await response.json();
        // Use correct defaults for current scope to avoid dupes
        const defaults = getIsNI() ? DEFAULT_NON_INSTRUCTOR_ROLES : DEFAULT_INSTRUCTOR_ROLES
        const customRolesList = data.roles
          .filter((role: string) => !defaults.some(def => def.value === role))
          .map((role: string) => ({
            value: role,
            label: role,
            isCustom: true,
            category: 'Custom Roles'
          }));
        setCustomRoles(customRolesList);
      } else {
        console.error('Failed to fetch roles:', response.statusText);
        // Fallback to localStorage if API fails
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback to localStorage if API fails
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, []);

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('customRoles');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomRoles(parsed);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  // Save to localStorage as backup
  const saveToLocalStorage = (roles: RoleOption[]) => {
    try {
      localStorage.setItem('customRoles', JSON.stringify(roles));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Get all roles (default + custom)
  const getAllRoles = useCallback((): RoleOption[] => {
    const defaults = getIsNI() ? DEFAULT_NON_INSTRUCTOR_ROLES : DEFAULT_INSTRUCTOR_ROLES
    return [...defaults, ...customRoles];
  }, [customRoles]);

  // Get roles organized by category
  const getRolesByCategory = useCallback(() => {
    const allRoles = getAllRoles();
    const categories: { [key: string]: RoleOption[] } = {};
    
    allRoles.forEach(role => {
      if (role.category) {
        if (!categories[role.category]) {
          categories[role.category] = [];
        }
        categories[role.category].push(role);
      }
    });
    
    return categories;
  }, [getAllRoles]);

  // Add a new custom role
  const addCustomRole = useCallback(async (newRole: string) => {
    const trimmedRole = newRole.trim();
    if (!trimmedRole) return false;

    // Check if it already exists
    const allRoles = getAllRoles();
    if (allRoles.some(role => role.label.toLowerCase() === trimmedRole.toLowerCase())) {
      return false;
    }

    const newRoleOption: RoleOption = {
      value: trimmedRole,
      label: trimmedRole,
      isCustom: true,
      category: 'Custom Roles'
    };

    const updatedCustomRoles = [...customRoles, newRoleOption];
    setCustomRoles(updatedCustomRoles);
    saveToLocalStorage(updatedCustomRoles);

    // Update backend
    try {
  const response = await fetch(getIsNI() ? '/api/dashboard/staff/non-instructor/roles' : '/api/dashboard/staff/instructor/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customRoles: updatedCustomRoles.map(role => role.value)
        }),
      });

      if (!response.ok) {
        console.error('Failed to save to backend, but saved locally');
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
    }

    return true;
  }, [customRoles, getAllRoles]);

  // Delete a custom role
  const deleteCustomRole = useCallback(async (roleToDelete: string) => {
    try {
      // Check if the role is being used by any instructors
  const checkResponse = await fetch(`${getIsNI() ? '/api/dashboard/staff/non-instructor/roles' : '/api/dashboard/staff/instructor/roles'}?check=${encodeURIComponent(roleToDelete)}`);
      if (checkResponse.ok) {
        const { isUsed, count } = await checkResponse.json();
        if (isUsed) {
          alert(`Cannot delete "${roleToDelete}" as it is currently used by ${count} instructor(s). Please update their role first.`);
          return false;
        }
      }

      const updatedCustomRoles = customRoles.filter(role => role.value !== roleToDelete);
      setCustomRoles(updatedCustomRoles);
      saveToLocalStorage(updatedCustomRoles);

      // Update backend
  const response = await fetch(getIsNI() ? '/api/dashboard/staff/non-instructor/roles' : '/api/dashboard/staff/instructor/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customRoles: updatedCustomRoles.map(role => role.value)
        }),
      });

      if (!response.ok) {
        console.error('Failed to update backend, but deleted locally');
      }

      return true;
    } catch (error) {
      console.error('Error deleting role:', error);
      return false;
    }
  }, [customRoles]);

  // Listen for instructor updates to refresh roles
  useEffect(() => {
    const handleInstructorUpdate = () => {
      fetchCustomRoles();
    };

    // Listen for custom events when instructors are updated
    window.addEventListener('instructorUpdated', handleInstructorUpdate);
    
    return () => {
      window.removeEventListener('instructorUpdated', handleInstructorUpdate);
    };
  }, [fetchCustomRoles]);

  // Initial load
  useEffect(() => {
    fetchCustomRoles();
  }, [fetchCustomRoles]);

  return {
    customRoles,
    getAllRoles,
    getRolesByCategory,
    addCustomRole,
    deleteCustomRole,
    loading,
    refresh: fetchCustomRoles
  };
}
