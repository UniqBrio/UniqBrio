"use client";

import { Button } from "@/components/dashboard/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dashboard/ui/dialog";
import { Input } from "@/components/dashboard/ui/input";
import { Label } from "@/components/dashboard/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/dashboard/ui/select";
import { Textarea } from "@/components/dashboard/ui/textarea";
import { AchievementFormData, AchievementType } from "@/types/dashboard/achievement";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/dashboard/ui/image-upload";

interface AchievementDialogProps {
  onSubmit: (data: AchievementFormData) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: Partial<AchievementFormData>;
  hideTrigger?: boolean;
  triggerLabel?: string;
}

export function AchievementDialog({
  onSubmit,
  isOpen,
  onOpenChange,
  initialData,
  hideTrigger,
  triggerLabel = 'Add Achievement',
}: AchievementDialogProps) {
  const [formData, setFormData] = useState<AchievementFormData>({
    type: initialData?.type || "individual",
    title: initialData?.title || "",
    description: initialData?.description || "",
    photo: initialData?.photo,
  });

  useEffect(() => {
    // Reset form when initialData changes or dialog opens
    setFormData({
      type: initialData?.type || "individual",
      title: initialData?.title || "",
      description: initialData?.description || "",
      photo: initialData?.photo,
    })
  }, [initialData, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="default">{triggerLabel}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Achievement' : 'Add New Achievement'}</DialogTitle>
            <DialogDescription>
              Create a new achievement to showcase student accomplishments.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: AchievementType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                className="col-span-3"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                className="col-span-3"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Photo</Label>
              <div className="col-span-3">
                <ImageUpload
                  onChange={(file) => setFormData({ ...formData, photo: file })}
                  value={formData.photo ? URL.createObjectURL(formData.photo) : ""}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Achievement</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
