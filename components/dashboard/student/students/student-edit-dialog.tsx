"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { type Student } from "@/types/dashboard/student"

interface StudentEditDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (student: Student) => void;
}

export function StudentEditDialog({ student, open, onOpenChange, onSave }: StudentEditDialogProps) {
  const [editedStudent, setEditedStudent] = useState<Student | null>(student);

  if (!student || !editedStudent) return null;

  const handleSave = () => {
    if (editedStudent) {
      onSave(editedStudent);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription className="sr-only">Edit student information and details</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editedStudent.name}
                onChange={(e) => setEditedStudent({ ...editedStudent, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={editedStudent.gender} 
                  onValueChange={(value) => setEditedStudent({ ...editedStudent, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={editedStudent.dob}
                  onChange={(e) => setEditedStudent({ ...editedStudent, dob: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                value={editedStudent.mobile}
                onChange={(e) => setEditedStudent({ ...editedStudent, mobile: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editedStudent.email}
                onChange={(e) => setEditedStudent({ ...editedStudent, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editedStudent.address}
                onChange={(e) => setEditedStudent({ ...editedStudent, address: e.target.value })}
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Academic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="courseOfInterestId">Primary Activity</Label>
              <Input
                id="courseOfInterestId"
                value={editedStudent.courseOfInterestId}
                onChange={(e) => setEditedStudent({ ...editedStudent, courseOfInterestId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={editedStudent.category} 
                onValueChange={(value) => setEditedStudent({ ...editedStudent, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrolledCourseName">Course</Label>
              <Select 
                value={editedStudent.enrolledCourseName || ''} 
                onValueChange={(value) => setEditedStudent({ ...editedStudent, enrolledCourseName: value })}
              >
                <SelectTrigger id="enrolledCourseName">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fine Arts">Fine Arts</SelectItem>
                  <SelectItem value="Performing Arts">Performing Arts</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="STEM">STEM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cohortId">Cohorts</Label>
              <Input
                id="cohortId"
                value={editedStudent.cohortId || ''}
                onChange={(e) => setEditedStudent({ ...editedStudent, cohortId: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
