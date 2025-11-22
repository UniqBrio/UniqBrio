'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card';
import { Badge } from '@/components/dashboard/ui/badge';
import { Button } from '@/components/dashboard/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/dashboard/ui/tooltip';
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
  DollarSign,
  Users,
  Target,
  Send,
  MapPin,
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

interface EnhancedCampaignListProps {
  campaigns: Campaign[];
  viewMode: 'list' | 'grid';
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaignId: string) => void;
}

export default function EnhancedCampaignList({
  campaigns,
  viewMode,
  onEdit,
  onDelete,
}: EnhancedCampaignListProps) {
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const calculateMetrics = (campaign: Campaign) => {
    const ctr =
      campaign.impressions && campaign.clicks
        ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
        : '0';
    const conversionRate =
      campaign.clicks && campaign.conversions_count
        ? ((campaign.conversions_count / campaign.clicks) * 100).toFixed(2)
        : '0';
    const budgetRemaining = (campaign.budget || 0) - (campaign.budget_spent || 0);
    const budgetPercentage =
      campaign.budget && campaign.budget > 0
        ? (((campaign.budget_spent || 0) / campaign.budget) * 100).toFixed(0)
        : '0';

    return { ctr, conversionRate, budgetRemaining, budgetPercentage };
  };

  if (campaigns.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
          <p className="text-sm">Try adjusting your filters or create a new campaign</p>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((campaign) => {
          const metrics = calculateMetrics(campaign);
          return (
            <Card
              key={campaign.id}
              className="border-2 hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden flex flex-col bg-gradient-to-br from-white to-gray-50"
            >
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-primary/15 rounded-lg text-primary flex-shrink-0">
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
                  <Badge className={`${getStatusColor(campaign.status)} border`}>
                    {campaign.status}
                  </Badge>
                  <Badge variant="outline">{campaign.type}</Badge>
                </div>

                {/* Budget Info */}
                {campaign.budget && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 text-xs font-semibold text-blue-900">
                        <DollarSign className="h-3.5 w-3.5" />
                        Budget
                      </div>
                      <span className="text-xs text-blue-700">
                        {metrics.budgetPercentage}% spent
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(parseInt(metrics.budgetPercentage), 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-blue-700">
                      <span>${campaign.budget_spent || 0} spent</span>
                      <span>${campaign.budget} total</span>
                    </div>
                  </div>
                )}

                {/* Target Audience */}
                {campaign.targetAudience && campaign.targetAudience.courses && campaign.targetAudience.courses.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-900">
                      <Target className="h-3.5 w-3.5" />
                      Target Audience
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {campaign.targetAudience.courses.slice(0, 3).map((course) => (
                        <Badge key={course} variant="secondary" className="text-xs">
                          {course}
                        </Badge>
                      ))}
                      {campaign.targetAudience.courses.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{campaign.targetAudience.courses.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Distribution Channels */}
                {campaign.channels && campaign.channels.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-900">
                      <Send className="h-3.5 w-3.5" />
                      Channels
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {campaign.channels.slice(0, 3).map((channel) => (
                        <Badge key={channel} variant="outline" className="text-xs bg-purple-50">
                          {channel}
                        </Badge>
                      ))}
                      {campaign.channels.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{campaign.channels.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium">Reach</p>
                    <p className="text-lg font-bold text-purple-900">
                      {(campaign.reach / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">Engagement</p>
                    <p className="text-lg font-bold text-blue-900">
                      {(campaign.engagement / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            <p className="text-xs text-indigo-600 font-medium">CTR</p>
                            <p className="text-lg font-bold text-indigo-900">{metrics.ctr}%</p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Click-Through Rate</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium">ROI</p>
                    <p className="text-lg font-bold text-amber-900">{campaign.roi}%</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-2 text-sm border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">
                      {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                      {new Date(campaign.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onEdit(campaign)}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(campaign.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // List View
  return (
    <div className="border-2 rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
            <TableHead className="font-semibold text-gray-900">Campaign</TableHead>
            <TableHead className="font-semibold text-gray-900">Type</TableHead>
            <TableHead className="font-semibold text-gray-900">Status</TableHead>
            <TableHead className="font-semibold text-gray-900">Budget</TableHead>
            <TableHead className="font-semibold text-right text-gray-900">Reach</TableHead>
            <TableHead className="font-semibold text-right text-gray-900">Engagement</TableHead>
            <TableHead className="font-semibold text-right text-gray-900">CTR</TableHead>
            <TableHead className="font-semibold text-right text-gray-900">Conv. %</TableHead>
            <TableHead className="font-semibold text-right text-gray-900">ROI %</TableHead>
            <TableHead className="font-semibold text-center text-gray-900">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const metrics = calculateMetrics(campaign);
            return (
              <TableRow key={campaign.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded text-primary flex-shrink-0">
                      {getTypeIcon(campaign.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{campaign.title}</div>
                      <div className="text-xs text-gray-500 truncate">{campaign.description}</div>
                    </div>
                    {campaign.featured && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{campaign.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(campaign.status)} border`}>
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {campaign.budget ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help text-sm font-medium">
                            ${(campaign.budget_spent || 0) / 1000}k / ${campaign.budget / 1000}k
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {metrics.budgetPercentage}% of budget spent
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">{campaign.reach.toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium">
                  {campaign.engagement.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium">{metrics.ctr}%</TableCell>
                <TableCell className="text-right font-medium">{metrics.conversionRate}%</TableCell>
                <TableCell className="text-right font-bold text-green-700">
                  {campaign.roi}%
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(campaign)}
                      title="Edit campaign"
                    >
                      <Edit2 className="h-4 w-4 text-purple-600" />
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
