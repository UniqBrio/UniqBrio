"use client";
import { Label } from "@/components/dashboard/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/dashboard/ui/select";
import { Input } from "@/components/dashboard/ui/input";
import { EditFormData } from "./types";
import React from "react";

export function EmploymentTab({ editForm, setEditForm }: { editForm: EditFormData; setEditForm: React.Dispatch<React.SetStateAction<EditFormData>>; }) {
  return (
    <div className="space-y-6 opacity-50 pointer-events-none select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loginUsername">Login Username</Label>
          <Input id="loginUsername" value={editForm.email} disabled className="bg-gray-50 text-gray-500" placeholder="Auto-generated from email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="temporaryPassword">Temporary Password</Label>
          <Input id="temporaryPassword" value={editForm.temporaryPassword || ""} disabled className="bg-gray-50 text-gray-500" placeholder="Auto-generated, will be emailed" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="permissionsLevel">Permissions / Access Level</Label>
          <Select value={editForm.permissionsLevel || ""} onValueChange={value => setEditForm(f => ({ ...f, permissionsLevel: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select access level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="senior-instructor">Senior Instructor</SelectItem>
              <SelectItem value="head-instructor">Head Instructor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
