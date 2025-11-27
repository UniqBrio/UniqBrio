'use client';

import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';

type CSSPropertiesWithVars = CSSProperties & Record<string, string>;
import { Button } from '@/components/dashboard/ui/button';
import { Input } from '@/components/dashboard/ui/input';
import { useCustomColors } from '@/lib/use-custom-colors';
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
import { Search, Filter, Check, X, ArrowUpDown, Plus, Download, Upload, List, Grid, FileText } from 'lucide-react';
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
  draftCount?: number;
  onOpenDrafts?: () => void;
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
  draftCount,
  onOpenDrafts,
}: CampaignFiltersProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<{ statuses: string[]; types: string[] }>({
    statuses: filterStatus === 'All' ? [] : [filterStatus],
    types: filterType === 'All' ? [] : [filterType],
  });
  const [filterAction, setFilterAction] = useState<'applied' | 'cleared' | null>(null);
  const firstCheckboxRef = useRef<HTMLInputElement>(null);

  const statuses = ['Active', 'Scheduled', 'Completed', 'Draft'] as const;
  const types = ['Marketing', 'Contest', 'Certificate', 'Design', 'Media', 'Special'] as const;
  const filtersActive = filterStatus !== 'All' || filterType !== 'All';
  useEffect(() => {
    if (!filterAction) return;
    const timer = window.setTimeout(() => setFilterAction(null), 2000);
    return () => window.clearTimeout(timer);
  }, [filterAction]);

  const handleClearAll = () => {
    onStatusChange('All');
    onTypeChange('All');
    setPendingFilters({ statuses: [], types: [] });
    setFilterDropdownOpen(false);
    setFilterAction('cleared');
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
    setFilterAction('applied');
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
              className="h-9 flex items-center gap-1 relative px-3 group border text-[color:var(--filter-icon-color)] hover:bg-[color:var(--filter-hover-bg)] hover:text-white"
              aria-label="Filter options"
              title="Advanced Filters"
              tabIndex={0}
              style={{
                borderColor: primaryColor,
                color: primaryColor,
                '--filter-icon-color': primaryColor,
                '--filter-hover-bg': primaryColor,
              } as CSSPropertiesWithVars}
              aria-pressed={filtersActive}
            >
              <span
                className="inline-flex relative transition-colors duration-200 group-hover:text-white"
              >
                <Filter className="h-3.5 w-3.5" />
                {filtersActive && (
                  <span className="absolute -top-1 -right-1">
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500 text-white shadow-sm ring-1 ring-white">
                      <Check className="w-2 h-2" />
                    </span>
                  </span>
                )}
                {!filtersActive && filterAction === 'cleared' && (
                  <span className="absolute -top-1 -right-1">
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500 text-white shadow-sm ring-1 ring-white">
                      <X className="w-2 h-2" />
                    </span>
                  </span>
                )}
              </span>
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
              className="h-9 flex items-center gap-1 whitespace-nowrap border text-[color:var(--sort-icon-color)] hover:bg-[color:var(--sort-hover-bg)] hover:text-white"
              style={{
                borderColor: primaryColor,
                color: primaryColor,
                backgroundColor: `${primaryColor}15`,
                '--sort-icon-color': primaryColor,
                '--sort-hover-bg': primaryColor,
              } as CSSPropertiesWithVars}
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
                {sortBy === option.value && (
                  <Check className="ml-2 h-3.5 w-3.5 text-green-600" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
 {/* View Mode Toggle */}
        <div className="flex border border-gray-300 rounded-md">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-r-none h-9"
            style={viewMode === 'list' ? { backgroundColor: primaryColor, color: 'white' } : {}}
            onMouseEnter={(e) => viewMode === 'list' ? e.currentTarget.style.backgroundColor = `${primaryColor}dd` : null}
            onMouseLeave={(e) => viewMode === 'list' ? e.currentTarget.style.backgroundColor = primaryColor : null}
            title="List View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-l-none border-l h-9"
            style={viewMode === 'grid' ? { backgroundColor: primaryColor, color: 'white' } : {}}
            onMouseEnter={(e) => viewMode === 'grid' ? e.currentTarget.style.backgroundColor = `${primaryColor}dd` : null}
            onMouseLeave={(e) => viewMode === 'grid' ? e.currentTarget.style.backgroundColor = primaryColor : null}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
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

       
       
 {/* Drafts Button */}
        {onOpenDrafts && (
          <Button
            variant={draftCount && draftCount > 0 ? "default" : "outline"}
            size="sm"
            className="h-9"
            onClick={onOpenDrafts}
            title={draftCount && draftCount > 0 ? `View ${draftCount} draft${draftCount > 1 ? 's' : ''}` : 'View campaign drafts'}
            style={draftCount && draftCount > 0 ? { backgroundColor: primaryColor, color: 'white' } : {}}
            onMouseEnter={(e) => draftCount && draftCount > 0 ? e.currentTarget.style.backgroundColor = `${primaryColor}dd` : null}
            onMouseLeave={(e) => draftCount && draftCount > 0 ? e.currentTarget.style.backgroundColor = primaryColor : null}
          >
            <FileText className="h-4 w-4 mr-2" />
            Drafts{typeof draftCount === 'number' ? ` (${draftCount})` : ''}
          </Button>
        )}

        {/* New Campaign Button */}
        <Button 
          className="text-white h-9 whitespace-nowrap"
          style={{ backgroundColor: primaryColor }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}dd`}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
          size="sm"
          onClick={onAddCampaign}
          title="Create a new campaign"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Count Badge */}
      <div className="flex items-center gap-3 rounded-lg px-4 py-2 w-fit" style={{ backgroundColor: `${primaryColor}15` }}>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }}></div>
        <span className="font-medium text-sm" style={{ color: `${primaryColor}dd` }}>{campaignCount}</span>
        <span className="text-sm" style={{ color: `${primaryColor}dd` }}>
          campaign{campaignCount !== 1 ? 's' : ''} found
        </span>
      </div>
    </div>
  );
}
