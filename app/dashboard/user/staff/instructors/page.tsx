"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"
import { Button } from "@/components/dashboard/ui/staff/button"
import { Edit, Trash2 } from "lucide-react"
import GridIcon from "@/components/dashboard/icons/grid"
import InstructorSearchAndFilters from "@/components/dashboard/instructor/instructor-profile/InstructorSearchAndFilters"
import { sampleInstructors, getRoleOptions } from "@/data/dashboard/instructors"
import type { Instructor, InstructorFilters } from "@/types/dashboard/staff/instructor"
import { INSTRUCTOR_TABLE_COLUMNS, type InstructorColumnId, getInstructorColumnLabel } from "@/components/dashboard/instructor/instructor-profile/instructor-columns"
import AddInstructorDialogWrapper from "@/components/dashboard/instructor/add-instructor-dialog-refactored/AddInstructorDialogWrapper"
import type { InstructorFormData } from "@/components/dashboard/instructor/add-instructor-dialog-refactored/types"
import { useInstructors, mapInstructorToForm } from "@/hooks/dashboard/staff/use-instructors"
import { useToast } from "@/hooks/dashboard/use-toast"

export default function InstructorManagementPage() {
  const { primaryColor, secondaryColor } = useCustomColors()
  const { toast } = useToast()
  const { instructors, addInstructor, updateInstructor, deleteInstructor, getFormById, addManyFromInstructors } = useInstructors();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  const [selectedFilters, setSelectedFilters] = useState<InstructorFilters>({
    role: [],
    gender: [],
    experience: [0, 50],
    status: [],
    department: []
  });
  
  const [pendingFilters, setPendingFilters] = useState<InstructorFilters>({
    role: [],
    gender: [],
    experience: [0, 50],
    status: [],
    department: []
  });

  // Filter and search logic
  const filteredInstructors = useMemo(() => {
    let filtered = instructors;

    // Apply search
    const term = searchTerm.trim().toLowerCase();
    if (term.length) {
      const tokens = term.split(/\s+/).filter(Boolean);
      filtered = filtered.filter(instructor => {
        const name = instructor.name?.toLowerCase() || "";
        const role = instructor.role?.toLowerCase() || "";
        const id = (instructor.id || "").toLowerCase();
        return tokens.every(t => (
          name.includes(t) ||
          role.includes(t) ||
          id.includes(t)
        ));
      });
    }

    // Apply filters
    if (selectedFilters.role.length > 0) {
      filtered = filtered.filter(instructor => 
        selectedFilters.role.includes(instructor.role)
      );
    }

    if (selectedFilters.gender.length > 0) {
      filtered = filtered.filter(instructor => 
        selectedFilters.gender.includes(instructor.gender)
      );
    }

    if (selectedFilters.status.length > 0) {
      filtered = filtered.filter(instructor => 
        instructor.status && selectedFilters.status.includes(instructor.status)
      );
    }

    if (selectedFilters.department.length > 0) {
      filtered = filtered.filter(instructor => 
        instructor.department && selectedFilters.department.includes(instructor.department)
      );
    }

    // Apply experience range filter
    if (selectedFilters.experience[0] > 0 || selectedFilters.experience[1] < 50) {
      filtered = filtered.filter(instructor => 
        instructor.experience >= selectedFilters.experience[0] && 
        instructor.experience <= selectedFilters.experience[1]
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'role':
          aVal = a.role || '';
          bVal = b.role || '';
          break;
        case 'experience':
          aVal = a.experience || 0;
          bVal = b.experience || 0;
          break;
        default:
          aVal = a.name || '';
          bVal = b.name || '';
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
      }
    });

    return filtered;
  }, [instructors, searchTerm, selectedFilters, sortBy, sortOrder]);

  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<InstructorFormData | null>(null);

  const handleEdit = (instructor: Instructor) => {
    const form = getFormById(instructor.id);
    setEditId(instructor.id);
    setEditDraft(form || null);
    setEditOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this instructor?')) {
      Promise.resolve(deleteInstructor(id))
        .then(() => {
          toast({
            title: "Instructor deleted",
            description: `The instructor ${id} was deleted successfully.`,
          })
        })
        .catch((e: any) => {
          toast({
            title: "Deletion failed",
            description: e?.message || "Unable to delete instructor.",
            variant: "destructive",
          })
        })
    }
  };

  const roleOptions = getRoleOptions(instructors);

  const handleAddSave = async (form: InstructorFormData) => {
    try {
      const added = await addInstructor(form)
      if (added) {
        toast({
          title: "Instructor created",
          description: `Instructor ${added.name} was successfully added.`,
        })
      }
    } catch (e: any) {
      toast({
        title: "Creation failed",
        description: e?.message || "Unable to add instructor.",
        variant: "destructive",
      })
    }
  }

  const handleEditSave = async (form: InstructorFormData) => {
    if (!editId) return
    try {
      const updated = await updateInstructor(editId, form)
      if (updated) {
        toast({
          title: "Instructor updated",
          description: `Instructor ${updated.name} was successfully updated.`,
        })
      }
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message || "Unable to update instructor.",
        variant: "destructive",
      })
    }
  }

  // Column visibility logic
  const [visibleColumns, setVisibleColumns] = useState<InstructorColumnId[]>(() => {
    if (typeof window === 'undefined') return INSTRUCTOR_TABLE_COLUMNS.map(c => c.id)
    try {
      const raw = localStorage.getItem('instructorDisplayedColumns')
      if (!raw) return INSTRUCTOR_TABLE_COLUMNS.map(c => c.id)
      const parsed = JSON.parse(raw) as string[]
      const ids = parsed.filter((id): id is InstructorColumnId => INSTRUCTOR_TABLE_COLUMNS.some(c => c.id === id))
      return ids.length ? ids : INSTRUCTOR_TABLE_COLUMNS.map(c => c.id)
    } catch {
      return INSTRUCTOR_TABLE_COLUMNS.map(c => c.id)
    }
  })

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail
      if (!detail) return
      const ids = detail.filter((id): id is InstructorColumnId => INSTRUCTOR_TABLE_COLUMNS.some(c => c.id === id))
      setVisibleColumns(ids)
      localStorage.setItem('instructorDisplayedColumns', JSON.stringify(ids))
    }
    window.addEventListener('instructor-displayed-columns-changed', handler as EventListener)
    return () => window.removeEventListener('instructor-displayed-columns-changed', handler as EventListener)
  }, [])

  const isVisible = (id: InstructorColumnId) => visibleColumns.includes(id)

  // Column selector modal
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const availableOptions = INSTRUCTOR_TABLE_COLUMNS.map(c => c.id).filter(id => !visibleColumns.includes(id)) as InstructorColumnId[]
  const [draftDisplayed, setDraftDisplayed] = useState<InstructorColumnId[]>(visibleColumns)
  const [selectedAvailable, setSelectedAvailable] = useState<InstructorColumnId[]>([])
  const [selectedDisplayed, setSelectedDisplayed] = useState<InstructorColumnId[]>([])
  const [focusedList, setFocusedList] = useState<'available' | 'displayed' | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const availableListRef = useRef<HTMLDivElement | null>(null)
  const displayedListRef = useRef<HTMLDivElement | null>(null)

  const openColumnModal = () => {
    setDraftDisplayed(visibleColumns)
    setSelectedAvailable([])
    setSelectedDisplayed([])
    setShowColumnSelector(true)
  }

  const addSelected = () => {
    const next = [...draftDisplayed, ...selectedAvailable]
    setDraftDisplayed(next)
    setSelectedAvailable([])
    window.dispatchEvent(new CustomEvent('instructor-displayed-columns-changed', { detail: next }))
  }

  const removeSelected = () => {
    const next = draftDisplayed.filter(col => !selectedDisplayed.includes(col))
    setDraftDisplayed(next)
    setSelectedDisplayed([])
    window.dispatchEvent(new CustomEvent('instructor-displayed-columns-changed', { detail: next }))
  }

  return (
    <>
      {/* LAYER 1: List of Instructors */}
      <InstructorSearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          pendingFilters={pendingFilters}
          setPendingFilters={setPendingFilters}
          instructors={instructors}
          setInstructors={(fnOrList) => {
            if (typeof fnOrList === 'function') {
              const next = (fnOrList as (prev: Instructor[]) => Instructor[])(instructors)
              addManyFromInstructors(next)
            }
          }}
          filteredInstructors={filteredInstructors}
          roleOptions={roleOptions}
          onAddInstructor={() => setAddOpen(true)}
        />

        {/* Instructors Table */}
        <table className="w-full">
              <thead>
                <tr>
                  {isVisible('id') && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-white">
                    {getInstructorColumnLabel('id')}
                  </th>)}
                  {isVisible('name') && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-white">
                    {getInstructorColumnLabel('name')}
                  </th>)}
                  {isVisible('role') && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-white">
                    {getInstructorColumnLabel('role')}
                  </th>)}
                  {isVisible('courseAssigned') && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-white">
                    {getInstructorColumnLabel('courseAssigned')}
                  </th>)}
                  {isVisible('cohortName') && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-white">
                    {getInstructorColumnLabel('cohortName')}
                  </th>)}
                  {isVisible('courseIds') && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-white">
                    {getInstructorColumnLabel('courseIds')}
                  </th>)}
                  {isVisible('cohortIds') && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-white">
                    {getInstructorColumnLabel('cohortIds')}
                  </th>)}
                  {isVisible('gender') && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-white">
                    {getInstructorColumnLabel('gender')}
                  </th>)}
                  {isVisible('experience') && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-white">
                    {getInstructorColumnLabel('experience')}
                  </th>)}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-white">
                    Edit
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-white">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInstructors.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 2} className="px-6 py-4 text-center text-gray-500 dark:text-white">
                      No instructors found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredInstructors.map((instructor) => (
                    <tr key={instructor.id} className="hover:bg-gray-25">
                      {isVisible('id') && (
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {instructor.id}
                      </td>)}
                      {isVisible('name') && (
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {instructor.name}
                      </td>)}
                      {isVisible('role') && (
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {instructor.role}
                      </td>)}
                      {isVisible('courseAssigned') && (
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {instructor.courseAssigned || ''}
                      </td>)}
                      {isVisible('cohortName') && (
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {instructor.cohortName || ''}
                      </td>)}
                      {isVisible('courseIds') && (
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {instructor.courseIds || ''}
                      </td>)}
                      {isVisible('cohortIds') && (
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {instructor.cohortIds || ''}
                      </td>)}
                      {isVisible('gender') && (
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {instructor.gender}
                      </td>)}
                      {isVisible('experience') && (
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {instructor.experience}
                      </td>)}
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(instructor)}
                          className="p-1"
                          style={{ color: primaryColor }}
                          title="Edit instructor"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(instructor.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete instructor"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

          {/* Results Summary */}
          <div className="mt-2 flex items-center justify-between px-4 py-1">
            <span className="text-xs text-gray-600 dark:text-white">
              {filteredInstructors.length} instructors
            </span>
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={openColumnModal}
              title="Select columns"
            >
              <GridIcon className="w-4 h-4 text-gray-500 dark:text-white" />
            </button>
          </div>

          {/* Column Selector Modal */}
          {showColumnSelector && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
              <div className="bg-white dark:bg-gray-900 rounded p-4 min-w-[650px] max-w-[96vw] shadow-lg">
                <h3 className="font-medium text-base mb-3">Select Columns</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="font-medium mb-2 text-sm">Available</div>
                    <div className="w-full h-32 border rounded p-2 overflow-y-auto text-sm">
                      {availableOptions.map((col) => (
                        <label key={col} className="flex items-center gap-2 py-1 cursor-pointer rounded px-2 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedAvailable.includes(col)}
                            onChange={() => setSelectedAvailable(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col])}
                          />
                          <span>{getInstructorColumnLabel(col)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-2">
                    <button
                      className="px-3 py-1 rounded"
                      style={{
                        backgroundColor: selectedAvailable.length === 0 ? '#e5e7eb' : `${primaryColor}20`,
                        color: selectedAvailable.length === 0 ? '#9ca3af' : primaryColor
                      }}
                      onClick={addSelected}
                      disabled={selectedAvailable.length === 0}
                    >
                      ?
                    </button>
                    <button
                      className="px-3 py-1 rounded"
                      style={{
                        backgroundColor: selectedDisplayed.length === 0 ? '#e5e7eb' : `${primaryColor}20`,
                        color: selectedDisplayed.length === 0 ? '#9ca3af' : primaryColor
                      }}
                      onClick={removeSelected}
                      disabled={selectedDisplayed.length === 0}
                    >
                      ?
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-2 text-sm">Displayed</div>
                    <div className="w-full h-32 border rounded p-2 overflow-y-auto text-sm">
                      {draftDisplayed.map((col) => (
                        <label key={col} className="flex items-center gap-2 py-1 cursor-pointer rounded px-2 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedDisplayed.includes(col)}
                            onChange={() => setSelectedDisplayed(prev => prev.includes(col) ? prev.filter(v => v !== col) : [...prev, col])}
                          />
                          <span>{getInstructorColumnLabel(col)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="px-3 py-1 text-sm rounded text-white"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => { 
                      localStorage.setItem('instructorDisplayedColumns', JSON.stringify(draftDisplayed)); 
                      window.dispatchEvent(new CustomEvent('instructor-displayed-columns-changed', { detail: draftDisplayed })); 
                      setShowColumnSelector(false) 
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => setShowColumnSelector(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

      {/* LAYER 2: Performance */}
      <h2 className="text-lg font-semibold mt-8 mb-3" style={{ color: primaryColor }}>Performance</h2>
      
      <div className="pb-3 border-b opacity-50 pointer-events-none select-none" aria-disabled="true">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">?</span>
          <span className="text-sm font-medium">AI-Enhanced Performance Reviews</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">NEW</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">4.8</div>
            <div className="text-xs text-gray-600 dark:text-white">Overall Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">95%</div>
            <div className="text-xs text-gray-600 dark:text-white">Student Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: primaryColor }}>A+</div>
            <div className="text-xs text-gray-600 dark:text-white">Performance Grade</div>
          </div>
        </div>
      </div>

      <div className="py-3 opacity-50 pointer-events-none select-none" aria-disabled="true">
        <div className="text-sm font-medium mb-2">AI Analysis Summary</div>
        <div className="text-xs text-gray-700 dark:text-white mb-3">
          Based on student feedback and performance metrics, Dr. Johnson demonstrates exceptional teaching abilities with consistent high ratings. Students particularly appreciate her clear explanations and patient approach to complex mathematical concepts.
        </div>

        <div className="text-sm font-medium mb-1">Key Strengths</div>
        <div className="grid grid-cols-2 gap-1 mb-3">
          <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">Clear Communication</div>
          <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">Student Engagement</div>
          <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">Punctuality</div>
          <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">Subject Expertise</div>
        </div>

        <div className="text-sm font-medium mb-1">Areas for Growth</div>
        <div className="grid grid-cols-2 gap-1">
          <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs">Technology Integration</div>
          <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs">Group Activities</div>
        </div>
      </div>

      {/* Add Instructor Dialog */}
      <AddInstructorDialogWrapper
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleAddSave}
        mode="add"
        title="Add New Instructor"
        saveLabel="Add Instructor"
      />

      {/* Edit Instructor Dialog */}
      <AddInstructorDialogWrapper
        open={editOpen}
        onOpenChange={setEditOpen}
        draftData={editDraft || undefined}
        onSave={handleEditSave}
        mode="edit"
        title="Edit Instructor"
        saveLabel="Save Changes"
      />
    </>
  );
}
