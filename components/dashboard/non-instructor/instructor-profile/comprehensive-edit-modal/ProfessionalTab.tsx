"use client";
import { Label } from "@/components/dashboard/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/dashboard/ui/select";
import { EditFormData } from "./types";
import React from "react";

export function ProfessionalTab({ editForm, setEditForm }: { editForm: EditFormData; setEditForm: React.Dispatch<React.SetStateAction<EditFormData>>; }) {
  return (
    <div className="space-y-6 opacity-50 pointer-events-none select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="branch">Branch</Label>
          <Select value={editForm.branch || ""} onValueChange={value => setEditForm(f => ({ ...f, branch: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main-campus">Main Campus</SelectItem>
              <SelectItem value="art-campus">Art Campus</SelectItem>
              <SelectItem value="sports-complex">Sports Complex</SelectItem>
              <SelectItem value="music-center">Music Center</SelectItem>
              <SelectItem value="downtown-branch">Downtown Branch</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department / Category</Label>
          <Select value={editForm.department || ""} onValueChange={value => setEditForm(f => ({ ...f, department: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="arts">Arts</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="music">Arts & Sports</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="reportingManager">Reporting Manager / Supervisor (Optional)</Label>
          <Select value={editForm.reportingManager || ""} onValueChange={value => setEditForm(f => ({ ...f, reportingManager: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select reporting manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="john-doe">John Doe - Head of Arts</SelectItem>
              <SelectItem value="jane-smith">Jane Smith - Sports Director</SelectItem>
              <SelectItem value="mike-johnson">Mike Johnson - Music Director</SelectItem>
              <SelectItem value="sarah-wilson">Sarah Wilson - Dance Coordinator</SelectItem>
              <SelectItem value="none">No Reporting Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
