'use client';

import { useState } from 'react';
import Image from 'next/image';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs';
import { Badge } from '@/components/dashboard/ui/badge';
import { Checkbox } from '@/components/dashboard/ui/checkbox';
import { AlertCircle, Zap } from 'lucide-react';

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
  budget?: number;
  targetAudience?: {
    ageGroups: string[];
    gender: string[];
    courses: string[];
    locations: string[];
  };
  venues?: string[];
  channels?: string[];
  budget_spent?: number;
  impressions?: number;
  clicks?: number;
  conversions_count?: number;
}

interface EnhancedCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign;
  onSave: (campaign: Campaign) => void;
  isEditing?: boolean;
}

const generateId = () => `CAMP${String(Math.floor(Math.random() * 10000)).padStart(3, '0')}`;

const SPORTS_COURSES = [
  'Football',
  'Basketball',
  'Tennis',
  'Swimming',
  'Badminton',
  'Cricket',
  'Martial Arts',
  'Yoga',
  'Gymnastics',
  'Athletics',
];

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const CHANNELS = ['Email', 'SMS', 'Social Media', 'In-App', 'WhatsApp'];
const VENUES = ['Main Campus', 'Branch 1', 'Branch 2', 'Community Center', 'Virtual'];
const AGE_GROUPS = ['5-10', '11-15', '16-20', '21-25', '26+'];

export default function EnhancedCampaignModal({
  open,
  onOpenChange,
  campaign,
  onSave,
  isEditing = false,
}: EnhancedCampaignModalProps) {
  const [formData, setFormData] = useState<Campaign>(
    campaign || {
      id: generateId(),
      title: '',
      type: 'Marketing',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Draft',
      reach: 0,
      engagement: 0,
      conversions: 0,
      roi: 0,
      featured: false,
      createdAt: new Date().toISOString().split('T')[0],
      budget: 0,
      budget_spent: 0,
      impressions: 0,
      clicks: 0,
      conversions_count: 0,
      targetAudience: {
        ageGroups: [],
        gender: [],
        courses: [],
        locations: [],
      },
      venues: [],
      channels: [],
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Campaign title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.reach < 0) newErrors.reach = 'Reach must be a positive number';
    if (formData.budget && formData.budget < 0) newErrors.budget = 'Budget must be a positive number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onOpenChange(false);
      setErrors({});
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setErrors({});
  };

  const toggleAgeGroup = (age: string) => {
    const current = formData.targetAudience?.ageGroups || [];
    setFormData({
      ...formData,
      targetAudience: {
        ...formData.targetAudience!,
        ageGroups: current.includes(age)
          ? current.filter((a) => a !== age)
          : [...current, age],
      },
    });
  };

  const toggleGender = (gender: string) => {
    const current = formData.targetAudience?.gender || [];
    setFormData({
      ...formData,
      targetAudience: {
        ...formData.targetAudience!,
        gender: current.includes(gender)
          ? current.filter((g) => g !== gender)
          : [...current, gender],
      },
    });
  };

  const toggleCourse = (course: string) => {
    const current = formData.targetAudience?.courses || [];
    setFormData({
      ...formData,
      targetAudience: {
        ...formData.targetAudience!,
        courses: current.includes(course)
          ? current.filter((c) => c !== course)
          : [...current, course],
      },
    });
  };

  const toggleVenue = (venue: string) => {
    const current = formData.venues || [];
    setFormData({
      ...formData,
      venues: current.includes(venue)
        ? current.filter((v) => v !== venue)
        : [...current, venue],
    });
  };

  const toggleChannel = (channel: string) => {
    const current = formData.channels || [];
    setFormData({
      ...formData,
      channels: current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel],
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the campaign details below'
              : 'Build a comprehensive promotional campaign for your sports academy'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Summer Enrollment Drive 2025"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Campaign Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Contest">Contest/Event</SelectItem>
                    <SelectItem value="Certificate">Achievement</SelectItem>
                    <SelectItem value="Design">Design/Creative</SelectItem>
                    <SelectItem value="Media">Media/Content</SelectItem>
                    <SelectItem value="Special">Special Offer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Campaign Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your campaign goals, content, and what you want to achieve..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <Checkbox
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, featured: checked as boolean })
                }
              />
              <Label htmlFor="featured" className="cursor-pointer text-sm font-medium">
                Mark as Featured Campaign
              </Label>
            </div>
          </TabsContent>

          {/* Target Audience Tab */}
          <TabsContent value="audience" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">Define who you want to reach with this campaign</p>
            </div>

            {/* Age Groups */}
            <div className="space-y-2">
              <Label className="font-semibold">Age Groups</Label>
              <div className="flex flex-wrap gap-2">
                {AGE_GROUPS.map((age) => (
                  <label
                    key={age}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.targetAudience?.ageGroups.includes(age) || false}
                      onCheckedChange={() => toggleAgeGroup(age)}
                    />
                    <span className="text-sm">{age} years</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="font-semibold">Gender</Label>
              <div className="flex flex-wrap gap-2">
                {['Male', 'Female', 'All'].map((gender) => (
                  <label
                    key={gender}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.targetAudience?.gender.includes(gender) || false}
                      onCheckedChange={() => toggleGender(gender)}
                    />
                    <span className="text-sm">{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sports Courses */}
            <div className="space-y-2">
              <Label className="font-semibold">Sports Courses</Label>
              <div className="grid grid-cols-2 gap-2">
                {SPORTS_COURSES.map((course) => (
                  <label
                    key={course}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.targetAudience?.courses.includes(course) || false}
                      onCheckedChange={() => toggleCourse(course)}
                    />
                    <span className="text-sm">{course}</span>
                  </label>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">Choose how to distribute your campaign</p>
            </div>

            {/* Channels */}
            <div className="space-y-2">
              <Label className="font-semibold">Distribution Channels</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((channel) => (
                  <label
                    key={channel}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.channels?.includes(channel) || false}
                      onCheckedChange={() => toggleChannel(channel)}
                    />
                    <span className="text-sm">{channel}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Venues */}
            <div className="space-y-2">
              <Label className="font-semibold">Academy Venues</Label>
              <div className="flex flex-wrap gap-2">
                {VENUES.map((venue) => (
                  <label
                    key={venue}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.venues?.includes(venue) || false}
                      onCheckedChange={() => toggleVenue(venue)}
                    />
                    <span className="text-sm">{venue}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Coming Soon: AI Features */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900 inline-flex items-center gap-2">AI-Powered Distribution <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></h3>
              </div>
              <p className="text-sm text-purple-700">
                Automatically optimize channel selection and venue recommendations based on historical
                performance and audience preferences
              </p>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            {/* Budget Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Campaign Budget</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Total Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    value={formData.budget || 0}
                    onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                    className={errors.budget ? 'border-red-500' : ''}
                    placeholder="0"
                  />
                  {errors.budget && <p className="text-xs text-red-500">{errors.budget}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget_spent">Budget Spent ($)</Label>
                  <Input
                    id="budget_spent"
                    type="number"
                    min="0"
                    value={formData.budget_spent || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, budget_spent: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    disabled
                  />
                  <p className="text-xs text-gray-500">Auto-updated during campaign</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="impressions">Estimated Impressions</Label>
                  <Input
                    id="impressions"
                    type="number"
                    min="0"
                    value={formData.impressions || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, impressions: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clicks">Estimated Clicks</Label>
                  <Input
                    id="clicks"
                    type="number"
                    min="0"
                    value={formData.clicks || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, clicks: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reach">Total Reach</Label>
                  <Input
                    id="reach"
                    type="number"
                    min="0"
                    value={formData.reach}
                    onChange={(e) => setFormData({ ...formData, reach: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engagement">Engagement</Label>
                  <Input
                    id="engagement"
                    type="number"
                    min="0"
                    value={formData.engagement}
                    onChange={(e) =>
                      setFormData({ ...formData, engagement: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conversions_count">Conversions</Label>
                  <Input
                    id="conversions_count"
                    type="number"
                    min="0"
                    value={formData.conversions_count || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conversions_count: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roi">ROI (%)</Label>
                  <Input
                    id="roi"
                    type="number"
                    min="0"
                    value={formData.roi}
                    onChange={(e) => setFormData({ ...formData, roi: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Coming Soon: AI Features */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-300 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-indigo-900 inline-flex items-center gap-2">AI-Powered Optimization <Image src="/Coming soon.svg" alt="Coming Soon" width={14} height={14} className="inline-block" /></h3>
              </div>
              <p className="text-sm text-indigo-700">
                Get AI recommendations for budget allocation, target audience refinement, and optimal
                timing for campaign launch
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            {isEditing ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
