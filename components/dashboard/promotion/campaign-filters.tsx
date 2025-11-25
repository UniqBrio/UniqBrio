'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/dashboard/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dashboard/ui/dropdown-menu';
import { Search, Filter, Check, X, ArrowUpDown, Plus, Download, Upload, List, Grid } from 'lucide-react';
import MultiSelectDropdown from '@/components/dashboard/promotion/MultiSelectDropDown';

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

interface CampaignFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterStatus: 'All' | 'Active' | 'Scheduled' | 'Completed' | 'Draft';
  onStatusChange: (status: 'All' | 'Active' | 'Scheduled' | 'Completed' | 'Draft') => void;
  filterType: 'All' | Campaign['type'];
  onTypeChange: (type: 'All' | Campaign['type']) => void;
  sortBy: 'reach' | 'engagement' | 'roi';
  onSortChange: (sort: 'reach' | 'engagement' | 'roi') => void;
  campaignCount: number;
  onAddCampaign: () => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  selectedCount?: number;
  onExportAll?: () => void;
  onExportSelected?: () => void;
}

export default function CampaignFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterType,
  onTypeChange,
  sortBy,
  onSortChange,
  campaignCount,
  onAddCampaign,
  viewMode,
  onViewModeChange,
  selectedCount = 0,
  onExportAll,
  onExportSelected,
}: CampaignFiltersProps) {
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<{ statuses: string[]; types: string[] }>({
    statuses: filterStatus === 'All' ? [] : [filterStatus],
    types: filterType === 'All' ? [] : [filterType],
  });
  const firstCheckboxRef = useRef<HTMLInputElement>(null);

  const statuses = ['Active', 'Scheduled', 'Completed', 'Draft'] as const;
  const types = ['Marketing', 'Contest', 'Certificate', 'Design', 'Media', 'Special'] as const;

  const handleClearAll = () => {
    onStatusChange('All');
    onTypeChange('All');
    setPendingFilters({ statuses: [], types: [] });
    setFilterDropdownOpen(false);
  };

  const handleApplyFilters = () => {
    if (pendingFilters.statuses.length > 0) {
      onStatusChange(pendingFilters.statuses[0] as any);
    } else {
      onStatusChange('All');
    }
    if (pendingFilters.types.length > 0) {
      onTypeChange(pendingFilters.types[0] as any);
    } else {
      onTypeChange('All');
    }
    setFilterDropdownOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Single Line Control Bar - All controls on same row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 min-w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-white" />
          <Input
            placeholder="Search campaigns..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Advanced Filter Button */}
        <Popover open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex items-center gap-1 relative"
              aria-label="Filter options"
              title="Advanced Filters"
              tabIndex={0}
            >
              <Filter className="h-3.5 w-3.5 text-purple-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-96 p-0"
            onCloseAutoFocus={(e) => e.preventDefault()}
            onEscapeKeyDown={() => setFilterDropdownOpen(false)}
            onInteractOutside={() => setFilterDropdownOpen(false)}
            onOpenAutoFocus={(e) => { e.preventDefault(); firstCheckboxRef.current?.focus(); }}
          >
            <div className="max-h-96 overflow-y-auto p-4">
              <MultiSelectDropdown
                label="Status"
                options={Array.from(statuses)}
                selected={pendingFilters.statuses}
                onChange={(next) => setPendingFilters(prev => ({ ...prev, statuses: next }))}
                className="mb-3"
              />

              <MultiSelectDropdown
                label="Type"
                options={Array.from(types)}
                selected={pendingFilters.types}
                onChange={(next) => setPendingFilters(prev => ({ ...prev, types: next }))}
                className="mb-3"
              />

              {/* Action Buttons */}
              <div className="flex justify-between gap-2 mt-4">
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              title="Sort campaigns"
              size="sm"
              className="h-9 flex items-center gap-1 whitespace-nowrap"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">
                {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            {[
              { value: 'reach', label: 'Reach' },
              { value: 'engagement', label: 'Engagement' },
              { value: 'roi', label: 'ROI' },
            ].map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value as any)}
              >
                {option.label}
                {sortBy === option.value && <span className="ml-2">?</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Import Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          title="Upload Files"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>

        {/* Export Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9" 
          title={selectedCount ? `Export ${selectedCount} selected` : 'Export all campaigns'}
          onClick={() => selectedCount ? onExportSelected?.() : onExportAll?.()}
        >
          <Download className="h-4 w-4 mr-2" />
          {selectedCount ? `Export (${selectedCount})` : 'Export'}
        </Button>

        {/* View Mode Toggle */}
        <div className="flex border border-gray-300 rounded-md">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={`rounded-r-none h-9 ${viewMode === 'list' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={`rounded-l-none border-l h-9 ${viewMode === 'grid' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>

        {/* New Campaign Button */}
        <Button 
          className="bg-purple-600 hover:bg-purple-700 text-white h-9 whitespace-nowrap"
          size="sm"
          onClick={onAddCampaign}
          title="Create a new campaign"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Count Badge */}
      <div className="flex items-center gap-3 bg-purple-50 rounded-lg px-4 py-2 w-fit">
        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
        <span className="text-purple-600 font-medium text-sm">{campaignCount}</span>
        <span className="text-purple-600 text-sm">
          campaign{campaignCount !== 1 ? 's' : ''} found
        </span>
      </div>
    </div>
  );
}
