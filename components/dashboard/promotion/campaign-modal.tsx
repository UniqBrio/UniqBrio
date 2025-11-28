'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select';
import { Textarea } from '@/components/dashboard/ui/textarea';
import { Label } from '@/components/dashboard/ui/label';
import { FileText, Loader2 } from 'lucide-react';
interface Campaign {
  id: string;
  title: string;
  type: 'Marketing' | 'Contest' | 'Certificate' | 'Design' | 'Media' | 'Special';
  description: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Scheduled' | 'Completed' | 'Draft';
  reach: number;
  engagement: number;
  conversions: number;
  roi: number;
  featured: boolean;
  createdAt: string;
}

interface CampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign;
  onSave: (campaign: Campaign) => void;
  isEditing?: boolean;
  onSaveDraft?: (campaign: Campaign, draftId?: string) => Promise<void> | void;
  draftId?: string;
  isSavingDraft?: boolean;
  onOpenDrafts?: () => void;
}

const generateId = () => `CAMP${String(Math.floor(Math.random() * 10000)).padStart(3, '0')}`;

export default function CampaignModal({
  open,
  onOpenChange,
  campaign,
  onSave,
  isEditing = false,
  onSaveDraft,
  draftId,
  isSavingDraft = false,
  onOpenDrafts,
}: CampaignModalProps) {
  const createDefaultCampaign = () => ({
    id: generateId(),
    title: '',
    type: 'Marketing' as Campaign['type'],
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Draft' as Campaign['status'],
    reach: 0,
    engagement: 0,
    conversions: 0,
    roi: 0,
    featured: false,
    createdAt: new Date().toISOString().split('T')[0],
  });

  const [formData, setFormData] = useState<Campaign>(() => campaign || createDefaultCampaign());
  const [initialData, setInitialData] = useState<Campaign | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if form has been modified
  const hasChanges = initialData ? JSON.stringify(formData) !== JSON.stringify(initialData) : true;

  // Reset form when campaign prop changes (for editing different campaigns)
  useEffect(() => {
    if (campaign) {
      setFormData(campaign);
      setInitialData(JSON.parse(JSON.stringify(campaign)));
      setErrors({});
    }
  }, [campaign]);

  // Reset form when dialog opens for new campaign
  useEffect(() => {
    if (open && !campaign) {
      const data = createDefaultCampaign();
      setFormData(data);
      setInitialData(JSON.parse(JSON.stringify(data)));
      setErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Campaign title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.reach < 0) newErrors.reach = 'Reach must be a positive number';
    if (formData.engagement < 0) newErrors.engagement = 'Engagement must be a positive number';
    if (formData.conversions < 0) newErrors.conversions = 'Conversions must be a positive number';
    if (formData.roi < 0) newErrors.roi = 'ROI must be a positive number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onOpenChange(false);
      setFormData(createDefaultCampaign());
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setFormData(campaign || createDefaultCampaign());
    setErrors({});
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    await onSaveDraft(formData, draftId);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Campaign' : 'Create New Campaign'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the campaign details below'
              : 'Fill in the campaign details to create a new promotional campaign'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
          {/* Campaign Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              placeholder="e.g., Summer Enrollment Drive 2025"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Campaign Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Campaign Type <span className="text-red-500">*</span></Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Contest">Contest</SelectItem>
                <SelectItem value="Certificate">Certificate</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Special">Special</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Textarea
              id="description"
              placeholder="Describe your campaign..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date <span className="text-red-500">*</span></Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className={errors.endDate ? 'border-red-500' : ''}
            />
            {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Reach */}
            <div className="space-y-2">
              <Label htmlFor="reach">Reach</Label>
              <Input
                id="reach"
                type="number"
                min="0"
                value={formData.reach}
                onChange={(e) => setFormData({ ...formData, reach: parseInt(e.target.value) || 0 })}
                className={errors.reach ? 'border-red-500' : ''}
              />
              {errors.reach && <p className="text-xs text-red-500">{errors.reach}</p>}
            </div>

            {/* Engagement */}
            <div className="space-y-2">
              <Label htmlFor="engagement">Engagement</Label>
              <Input
                id="engagement"
                type="number"
                min="0"
                value={formData.engagement}
                onChange={(e) => setFormData({ ...formData, engagement: parseInt(e.target.value) || 0 })}
                className={errors.engagement ? 'border-red-500' : ''}
              />
              {errors.engagement && <p className="text-xs text-red-500">{errors.engagement}</p>}
            </div>

            {/* Conversions */}
            <div className="space-y-2">
              <Label htmlFor="conversions">Conversions</Label>
              <Input
                id="conversions"
                type="number"
                min="0"
                value={formData.conversions}
                onChange={(e) => setFormData({ ...formData, conversions: parseInt(e.target.value) || 0 })}
                className={errors.conversions ? 'border-red-500' : ''}
              />
              {errors.conversions && <p className="text-xs text-red-500">{errors.conversions}</p>}
            </div>

            {/* ROI */}
            <div className="space-y-2">
              <Label htmlFor="roi">ROI (%)</Label>
              <Input
                id="roi"
                type="number"
                min="0"
                value={formData.roi}
                onChange={(e) => setFormData({ ...formData, roi: parseInt(e.target.value) || 0 })}
                className={errors.roi ? 'border-red-500' : ''}
              />
              {errors.roi && <p className="text-xs text-red-500">{errors.roi}</p>}
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <Label htmlFor="featured" className="cursor-pointer text-sm">
              Mark as Featured Campaign
            </Label>
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenDrafts?.()}
            title="View saved drafts"
            className="mr-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            Drafts
          </Button>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleSaveDraft()}
            title="Save as draft"
            disabled={isSavingDraft || !hasChanges}
          >
            {isSavingDraft && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {draftId ? 'Update Draft' : 'Save Draft'}
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90" disabled={!hasChanges}>
            {isEditing ? 'Save Changes' : 'Create Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
