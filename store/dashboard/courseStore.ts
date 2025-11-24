import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export interface Course {
  id: string;
  courseId?: string;
  name: string;
  instructor: string;
  category: string;
  level: string;
  price: number;
  priceINR?: number;
  rating: number;
  enrolledStudents: number;
  status: string;
  completionRate: number;
  thumbnail?: string;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DraftType {
  id: string;
  title: string;
  instructor: string;
  category: string;
  lastModified: string;
  status: string;
}

export interface Cohort {
  id: string;
  name: string;
  course: string;
  students: number;
  startDate: string;
  instructor: string;
  status: string;
}

export interface Filters {
  category: string[];
  level: string[];
  instructor: string[];
  status: string[];
  priceRange: [number, number];
}

// Store interfaces
interface CourseState {
  // Data
  courses: Course[];
  drafts: DraftType[];
  cohorts: Cohort[];
  loading: boolean;
  error: string | null;
  
  // UI State
  searchTerm: string;
  selectedFilters: Filters;
  pendingFilters: Filters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currency: string;
  viewMode: 'grid' | 'list';
  activeTab: string;
  
  // Selected items
  selectedCourse: Course | null;
  selectedCourseIds: string[];
  
  // Modal states
  isEditMode: boolean;
  editCourseId: string | null;
  isDraftsDialogOpen: boolean;
  showDeleteConfirmation: boolean;
  
  // Actions
  setCourses: (courses: Course[]) => void;
  setDrafts: (drafts: DraftType[]) => void;
  setCohorts: (cohorts: Cohort[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Search and filter actions
  setSearchTerm: (term: string) => void;
  setSelectedFilters: (filters: Filters) => void;
  setPendingFilters: (filters: Filters) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setCurrency: (currency: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setActiveTab: (tab: string) => void;
  
  // Selection actions
  setSelectedCourse: (course: Course | null) => void;
  setSelectedCourseIds: (ids: string[]) => void;
  toggleCourseSelection: (id: string) => void;
  
  // Modal actions
  setIsEditMode: (isEdit: boolean) => void;
  setEditCourseId: (id: string | null) => void;
  setIsDraftsDialogOpen: (open: boolean) => void;
  setShowDeleteConfirmation: (show: boolean) => void;
  
  // Computed values
  getFilteredCourses: () => Course[];
  getStats: () => {
    totalCourses: number;
    activeCourses: number;
    totalStudents: number;
    totalRevenue: number;
    averageRating: number;
    completionRate: number;
  };
  
  // Async actions
  fetchCourses: () => Promise<void>;
  fetchDrafts: () => Promise<void>;
  fetchCohorts: () => Promise<void>;
  initializeData: () => Promise<void>;
}

// Default filters
const defaultFilters: Filters = {
  category: [],
  level: [],
  instructor: [],
  status: [],
  priceRange: [0, 10000],
};

// Create the store
export const useCourseStore = create<CourseState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        courses: [],
        drafts: [],
        cohorts: [],
        loading: false,
        error: null,
        
        // UI state
        searchTerm: '',
        selectedFilters: defaultFilters,
        pendingFilters: defaultFilters,
        sortBy: 'courseId',
        sortOrder: 'asc',
        currency: 'USD',
        viewMode: 'grid',
        activeTab: 'all',
        
        // Selected items
        selectedCourse: null,
        selectedCourseIds: [],
        
        // Modal states
        isEditMode: false,
        editCourseId: null,
        isDraftsDialogOpen: false,
        showDeleteConfirmation: false,
        
        // Basic setters
        setCourses: (courses) => set({ courses }, false, 'setCourses'),
        setDrafts: (drafts) => set({ drafts }, false, 'setDrafts'),
        setCohorts: (cohorts) => set({ cohorts }, false, 'setCohorts'),
        setLoading: (loading) => set({ loading }, false, 'setLoading'),
        setError: (error) => set({ error }, false, 'setError'),
        
        // Search and filter setters
        setSearchTerm: (searchTerm) => set({ searchTerm }, false, 'setSearchTerm'),
        setSelectedFilters: (selectedFilters) => set({ selectedFilters }, false, 'setSelectedFilters'),
        setPendingFilters: (pendingFilters) => set({ pendingFilters }, false, 'setPendingFilters'),
        setSortBy: (sortBy) => set({ sortBy }, false, 'setSortBy'),
        setSortOrder: (sortOrder) => set({ sortOrder }, false, 'setSortOrder'),
        setCurrency: (currency) => set({ currency }, false, 'setCurrency'),
        setViewMode: (viewMode) => set({ viewMode }, false, 'setViewMode'),
        setActiveTab: (activeTab) => set({ activeTab }, false, 'setActiveTab'),
        
        // Selection setters
        setSelectedCourse: (selectedCourse) => set({ selectedCourse }, false, 'setSelectedCourse'),
        setSelectedCourseIds: (selectedCourseIds) => set({ selectedCourseIds }, false, 'setSelectedCourseIds'),
        toggleCourseSelection: (id) => {
          const { selectedCourseIds } = get();
          const newSelection = selectedCourseIds.includes(id)
            ? selectedCourseIds.filter(cid => cid !== id)
            : [...selectedCourseIds, id];
          set({ selectedCourseIds: newSelection }, false, 'toggleCourseSelection');
        },
        
        // Modal setters
        setIsEditMode: (isEditMode) => set({ isEditMode }, false, 'setIsEditMode'),
        setEditCourseId: (editCourseId) => set({ editCourseId }, false, 'setEditCourseId'),
        setIsDraftsDialogOpen: (isDraftsDialogOpen) => set({ isDraftsDialogOpen }, false, 'setIsDraftsDialogOpen'),
        setShowDeleteConfirmation: (showDeleteConfirmation) => set({ showDeleteConfirmation }, false, 'setShowDeleteConfirmation'),
        
        // Computed values
        getFilteredCourses: () => {
          const { courses, searchTerm, selectedFilters, activeTab, currency, sortBy, sortOrder } = get();
          
          if (!Array.isArray(courses)) return [];
          
          let filtered = courses.filter((course) => {
            // Search filter
            const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              course.category?.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Category filter
            const matchesCategory = selectedFilters.category.length === 0 || 
              selectedFilters.category.includes(course.category);
            
            // Level filter
            const matchesLevel = selectedFilters.level.length === 0 || 
              selectedFilters.level.includes(course.level);
            
            // Instructor filter
            const matchesInstructor = selectedFilters.instructor.length === 0 || 
              selectedFilters.instructor.includes(course.instructor);
            
            // Status filter
            const matchesStatus = selectedFilters.status.length === 0 || 
              selectedFilters.status.includes(course.status);
            
            // Price filter
            // Note: priceINR is a legacy field name, but it now stores price in the academy's selected currency
            const price = course.priceINR || course.price || 0;
            const matchesPrice = price >= selectedFilters.priceRange[0] && 
              price <= selectedFilters.priceRange[1];
            
            // Tab filter
            const matchesTab = activeTab === "all" || 
              (activeTab === "active" && course.status === "Active") ||
              (activeTab === "completed" && course.status === "Completed") ||
              (activeTab === "draft" && course.status === "Draft");
            
            return matchesSearch && matchesCategory && matchesLevel && 
              matchesInstructor && matchesStatus && matchesPrice && matchesTab;
          });
          
          // Sort
          return filtered.sort((a, b) => {
            const aValue = a[sortBy as keyof Course];
            const bValue = b[sortBy as keyof Course];
            
            if (typeof aValue === "string" && typeof bValue === "string") {
              return sortOrder === "asc" 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            } else if (typeof aValue === "number" && typeof bValue === "number") {
              return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
            }
            return 0;
          });
        },
        
        getStats: () => {
          const { courses, currency } = get();
          
          if (!Array.isArray(courses)) {
            return {
              totalCourses: 0,
              activeCourses: 0,
              totalStudents: 0,
              totalRevenue: 0,
              averageRating: 0,
              completionRate: 0,
            };
          }
          
          return {
            totalCourses: courses.length,
            activeCourses: courses.filter(c => c.status === "Active").length,
            totalStudents: courses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0),
            totalRevenue: courses.reduce((sum, c) => {
              // Note: priceINR is a legacy field name, but it now stores price in the academy's selected currency
              const price = c.priceINR || c.price || 0;
              return sum + price * (c.enrolledStudents || 0);
            }, 0),
            averageRating: courses.length > 0 
              ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length 
              : 0,
            completionRate: courses.length > 0 
              ? courses.reduce((sum, c) => sum + (c.completionRate || 0), 0) / courses.length 
              : 0,
          };
        },
        
        // Async actions
        fetchCourses: async () => {
          try {
            set({ loading: true, error: null });
            
            // Fetch academy currency from settings
            try {
              const academyResponse = await fetch("/api/dashboard/academy-info");
              if (academyResponse.ok) {
                const academyData = await academyResponse.json();
                if (academyData.businessInfo?.currency) {
                  set({ currency: academyData.businessInfo.currency });
                }
              }
            } catch (error) {
              console.error('Failed to fetch academy currency:', error);
              // Continue with default currency if fetch fails
            }
            
            const response = await fetch("/api/dashboard/services/courses");
            const data = await response.json();
            
            if (data.success && data.courses) {
              set({ courses: data.courses, loading: false });
            } else if (Array.isArray(data)) {
              set({ courses: data, loading: false });
            } else {
              set({ courses: [], loading: false });
            }
          } catch (error) {
            console.error('Failed to fetch courses:', error);
            set({ courses: [], loading: false, error: 'Failed to fetch courses' });
          }
        },
        
        fetchDrafts: async () => {
          try {
            const response = await fetch("/api/dashboard/services/courses/drafts");
            const data = await response.json();
            
            if (data.success && data.drafts) {
              set({ drafts: data.drafts });
            } else if (Array.isArray(data)) {
              set({ drafts: data });
            } else {
              set({ drafts: [] });
            }
          } catch (error) {
            console.error('Failed to fetch drafts:', error);
            set({ drafts: [] });
          }
        },
        
        fetchCohorts: async () => {
          try {
            const response = await fetch('/api/dashboard/services/cohorts');
            const data = await response.json();
            
            if (data.success && data.cohorts) {
              set({ cohorts: data.cohorts });
            } else if (Array.isArray(data)) {
              set({ cohorts: data });
            } else {
              set({ cohorts: [] });
            }
          } catch (error) {
            console.error('Failed to fetch cohorts:', error);
            set({ cohorts: [] });
          }
        },
        
        initializeData: async () => {
          const { fetchCourses, fetchDrafts, fetchCohorts } = get();
          await Promise.all([
            fetchCourses(),
            fetchDrafts(),
            fetchCohorts(),
          ]);
        },
      }),
      {
        name: 'course-store',
        // Only persist UI preferences, not data
        partialize: (state) => ({
          currency: state.currency,
          viewMode: state.viewMode,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          selectedFilters: state.selectedFilters,
        }),
      }
    ),
    { name: 'course-store' }
  )
);

// Selectors for performance
export const useCourses = () => useCourseStore((state) => state.courses);
export const useFilteredCourses = () => useCourseStore((state) => state.getFilteredCourses());
export const useCourseStats = () => useCourseStore((state) => state.getStats());
export const useLoading = () => useCourseStore((state) => state.loading);
export const useSearchTerm = () => useCourseStore((state) => state.searchTerm);
export const useSelectedFilters = () => useCourseStore((state) => state.selectedFilters);
