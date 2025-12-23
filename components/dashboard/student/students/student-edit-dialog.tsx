"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import { Label } from "@/components/dashboard/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/ui/avatar"
import { ImagePlus, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/dashboard/use-toast"
import { type Student } from "@/types/dashboard/student"

interface StudentEditDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (student: Student) => void;
}

export function StudentEditDialog({ student, open, onOpenChange, onSave }: StudentEditDialogProps) {
  const [editedStudent, setEditedStudent] = useState<Student | null>(student);
  const { toast } = useToast();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(student?.photoUrl || null);

  // Update states when student prop changes (e.g., when opening dialog with different student)
  useEffect(() => {
    if (student) {
      setEditedStudent(student);
      setPhotoPreviewUrl(student.photoUrl || null);
    }
  }, [student]);

  if (!student || !editedStudent) return null;

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPEG, PNG, WebP, or GIF image.',
        variant: 'destructive',
        duration: 3000,
      });
      event.target.value = '';
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5 MB.',
        variant: 'destructive',
        duration: 3000,
      });
      event.target.value = '';
      return;
    }

    const tempPreview = URL.createObjectURL(file);
    setPhotoPreviewUrl(tempPreview);
    setPhotoUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/dashboard/student/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.photoUrl) {
        const message = data?.message || 'Failed to upload photo.';
        throw new Error(message);
      }

      URL.revokeObjectURL(tempPreview);
      setPhotoPreviewUrl(data.photoUrl);
      setEditedStudent({ ...editedStudent, photoUrl: data.photoUrl });
      
      toast({
        title: 'Photo uploaded',
        description: 'Student photo has been uploaded successfully.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to upload student photo', error);
      URL.revokeObjectURL(tempPreview);
      setPhotoPreviewUrl(editedStudent.photoUrl || null);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Could not upload the selected image. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
      event.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoPreviewUrl(null);
    setEditedStudent({ ...editedStudent, photoUrl: '' });
    setPhotoUploading(false);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

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
          {/* Photo Upload Section */}
          <div className="md:col-span-2 flex flex-col items-center gap-4 p-4 border rounded-lg bg-gray-50">
            <Label className="text-sm font-medium">Student Photo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoPreviewUrl || undefined} alt={editedStudent.name} />
                <AvatarFallback className="text-2xl">
                  {editedStudent.name?.substring(0, 2).toUpperCase() || 'ST'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={photoUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                >
                  {photoUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {photoPreviewUrl ? 'Replace Photo' : 'Upload Photo'}
                    </>
                  )}
                </Button>
                {photoPreviewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePhoto}
                    disabled={photoUploading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>
          </div>

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
