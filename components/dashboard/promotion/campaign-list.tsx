'use client';

import { useState } from 'react';
import { useCustomColors } from '@/lib/use-custom-colors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Badge } from '@/components/dashboard/ui/badge';
import { Button } from '@/components/dashboard/ui/button';
import { Checkbox } from '@/components/dashboard/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table';
import {
  Megaphone,
  Trophy,
  BadgeIcon as Certificate,
  Palette,
  Video,
  Sparkles,
  TrendingUp,
  Eye,
  Edit2,
  Share2,
  Download,
  Trash2,
  BarChart3,
  Star,
  Calendar,
  Users,
  Target,
  X,
} from 'lucide-react';

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

interface CampaignListProps {
  campaigns: Campaign[];
  viewMode: 'list' | 'grid';
  displayedColumns?: string[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaignId: string) => void;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;
}

export default function CampaignList({
  campaigns,
  viewMode,
  displayedColumns = ['Campaign', 'Type', 'Status', 'Reach', 'Actions'],
  onEdit,
  onDelete,
  selectedIds = [],
  onSelectChange,
}: CampaignListProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800 dark:text-white';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:text-white';
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'Marketing':
        return <Megaphone className="h-4 w-4" />;
      case 'Contest':
        return <Trophy className="h-4 w-4" />;
      case 'Certificate':
        return <Certificate className="h-4 w-4" />;
      case 'Design':
        return <Palette className="h-4 w-4" />;
      case 'Media':
        return <Video className="h-4 w-4" />;
      case 'Special':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  if (campaigns.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="h-16 w-16 text-gray-300 dark:text-white mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
          <p className="text-sm">Try adjusting your filters or create a new campaign</p>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <Card
            key={campaign.id}
            className="border-2 hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden flex flex-col"
          >
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {getTypeIcon(campaign.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-2">{campaign.title}</CardTitle>
                    <CardDescription className="text-xs mt-1 line-clamp-2">
                      {campaign.description}
                    </CardDescription>
                  </div>
                </div>
                {campaign.featured && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4 pt-4">
              {/* Status and Type Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
                <Badge variant="outline">{campaign.type}</Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}80`, borderWidth: '1px' }}>
                  <p className="text-xs font-medium" style={{ color: `${primaryColor}cc` }}>Reach</p>
                  <p className="text-lg font-bold" style={{ color: primaryColor }}>
                    {(campaign.reach / 1000).toFixed(1)}k
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">Engagement</p>
                  <p className="text-lg font-bold text-blue-900">
                    {(campaign.engagement / 1000).toFixed(1)}k
                  </p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <p className="text-xs text-indigo-600 font-medium">Conversions</p>
                  <p className="text-lg font-bold text-indigo-900">{campaign.conversions}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600 font-medium">ROI</p>
                  <p className="text-lg font-bold text-amber-900">{campaign.roi}%</p>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-medium">
                    {new Date(campaign.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End:</span>
                  <span className="font-medium">
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  title="View campaign details"
                  onClick={() => setViewingCampaign(campaign)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(campaign)}
                  title="Edit campaign"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(campaign.id)}
                  title="Delete campaign"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // List View
  return (
    <div className="border-2 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className={campaigns.length > 5 ? "max-h-[360px] overflow-y-auto" : ""}>
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-white border-b">
              <TableRow>
            <TableHead className="w-10">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={campaigns.length > 0 && campaigns.every(c => selectedIds.includes(c.id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectChange?.(campaigns.map(c => c.id))
                    } else {
                      onSelectChange?.([])
                    }
                  }}
                  aria-label="Select all"
                  title="Select all campaigns"
                />
              </div>
            </TableHead>
            {displayedColumns.includes('Campaign') && <TableHead className="font-semibold">Campaign</TableHead>}
            {displayedColumns.includes('Type') && <TableHead className="font-semibold">Type</TableHead>}
            {displayedColumns.includes('Status') && <TableHead className="font-semibold">Status</TableHead>}
            {displayedColumns.includes('Reach') && <TableHead className="font-semibold text-right">Reach</TableHead>}
            {displayedColumns.includes('Engagement') && <TableHead className="font-semibold text-right">Engagement</TableHead>}
            {displayedColumns.includes('Conversions') && <TableHead className="font-semibold text-right">Conversions</TableHead>}
            {displayedColumns.includes('ROI') && <TableHead className="font-semibold text-right">ROI %</TableHead>}
            {displayedColumns.includes('Duration') && <TableHead className="font-semibold">Duration</TableHead>}
            {displayedColumns.includes('Actions') && <TableHead className="font-semibold text-center">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selectedIds.includes(campaign.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectChange?.([...selectedIds, campaign.id])
                      } else {
                        onSelectChange?.(selectedIds.filter(id => id !== campaign.id))
                      }
                    }}
                    aria-label={`Select ${campaign.title}`}
                  />
                </div>
              </TableCell>
              {displayedColumns.includes('Campaign') && (
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded text-primary">
                      {getTypeIcon(campaign.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{campaign.title}</div>
                      <div className="text-xs text-gray-500 dark:text-white truncate">{campaign.description}</div>
                    </div>
                    {campaign.featured && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                </TableCell>
              )}
              {displayedColumns.includes('Type') && (
                <TableCell>
                  <Badge variant="outline">{campaign.type}</Badge>
                </TableCell>
              )}
              {displayedColumns.includes('Status') && (
                <TableCell>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </TableCell>
              )}
              {displayedColumns.includes('Reach') && (
                <TableCell className="text-right font-medium">{campaign.reach.toLocaleString()}</TableCell>
              )}
              {displayedColumns.includes('Engagement') && (
                <TableCell className="text-right font-medium">
                  {campaign.engagement.toLocaleString()}
                </TableCell>
              )}
              {displayedColumns.includes('Conversions') && (
                <TableCell className="text-right font-medium">{campaign.conversions}</TableCell>
              )}
              {displayedColumns.includes('ROI') && (
                <TableCell className="text-right font-medium">{campaign.roi}%</TableCell>
              )}
              {displayedColumns.includes('Duration') && (
                <TableCell className="text-sm text-gray-600 dark:text-white">
                  {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                  {new Date(campaign.endDate).toLocaleDateString()}
                </TableCell>
              )}
              {displayedColumns.includes('Actions') && (
                <TableCell>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="View campaign"
                      onClick={() => setViewingCampaign(campaign)}
                    >
                      <Eye className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(campaign)}
                      title="Edit campaign"
                    >
                      <Edit2 className="h-4 w-4" style={{ color: primaryColor }} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(campaign.id)}
                      title="Delete campaign"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
        </div>
      </div>

      {/* View Campaign Dialog */}
      <Dialog open={viewingCampaign !== null} onOpenChange={(open) => !open && setViewingCampaign(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {viewingCampaign && getTypeIcon(viewingCampaign.type)}
              </div>
              <div>
                <span className="text-xl">{viewingCampaign?.title}</span>
                {viewingCampaign?.featured && (
                  <Star className="inline-block ml-2 h-5 w-5 fill-yellow-400 text-yellow-400" />
                )}
              </div>
            </DialogTitle>
            <DialogDescription>{viewingCampaign?.description}</DialogDescription>
          </DialogHeader>

          {viewingCampaign && (
            <div className="space-y-6 py-4">
              {/* Status and Type */}
              <div className="flex flex-wrap gap-3">
                <Badge className={getStatusColor(viewingCampaign.status)}>
                  {viewingCampaign.status}
                </Badge>
                <Badge variant="outline">{viewingCampaign.type}</Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Users className="h-5 w-5 mx-auto mb-2" style={{ color: primaryColor }} />
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {viewingCampaign.reach.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Reach</p>
                </div>
                <div className="rounded-lg p-4 text-center bg-blue-50">
                  <TrendingUp className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-900">
                    {viewingCampaign.engagement.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
                <div className="rounded-lg p-4 text-center bg-indigo-50">
                  <Target className="h-5 w-5 mx-auto mb-2 text-indigo-600" />
                  <p className="text-2xl font-bold text-indigo-900">
                    {viewingCampaign.conversions}
                  </p>
                  <p className="text-xs text-muted-foreground">Conversions</p>
                </div>
                <div className="rounded-lg p-4 text-center bg-amber-50">
                  <BarChart3 className="h-5 w-5 mx-auto mb-2 text-amber-600" />
                  <p className="text-2xl font-bold text-amber-900">
                    {viewingCampaign.roi}%
                  </p>
                  <p className="text-xs text-muted-foreground">ROI</p>
                </div>
              </div>

              {/* Duration */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Campaign Duration
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{new Date(viewingCampaign.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-medium">{new Date(viewingCampaign.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Created At */}
              <div className="text-sm text-muted-foreground">
                Created on {new Date(viewingCampaign.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setViewingCampaign(null)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 text-white"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => {
                    onEdit(viewingCampaign);
                    setViewingCampaign(null);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Campaign
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
