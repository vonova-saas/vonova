/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/utils/functions';
import { FeedbackFilters as FeedbackFiltersType, FeedbackType } from '../types';

// Ensure dateRange is always defined with both from and to as Date | null
type SafeFeedbackFilters = Omit<FeedbackFiltersType, 'dateRange'> & {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
};

interface FeedbackFiltersProps {
  onFilterChange: (filters: Omit<FeedbackFiltersType, 'dateRange'> & {
    dateRange: {
      from: Date | null;
      to: Date | null;
    };
  }) => void;
  initialFilters?: Partial<FeedbackFiltersType>;
  className?: string;
}

export function FeedbackFilters({ onFilterChange, initialFilters = {}, className = '' }: FeedbackFiltersProps) {
  const [filters, setFilters] = useState<SafeFeedbackFilters>(() => {
    // Safely initialize with proper null checks
    const initialType = initialFilters.type || 'all';
    const initialStatus = initialFilters.status || 'all';
    const initialSearch = initialFilters.search || '';
    const initialDateRange = {
      from: initialFilters.dateRange?.from || null,
      to: initialFilters.dateRange?.to || null,
    };
    
    return {
      type: initialType as FeedbackType | 'all',
      status: initialStatus as 'all' | 'new' | 'in_progress' | 'resolved' | 'rejected',
      search: initialSearch,
      dateRange: initialDateRange,
    };
  });

  // Update parent when filters change
  useEffect(() => {
    const { dateRange, ...restFilters } = filters;
    onFilterChange({
      ...restFilters,
      dateRange: {
        from: dateRange?.from || null,
        to: dateRange?.to || null,
      },
    });
  }, [filters, onFilterChange]);

  const handleDateSelect = (date: Date | undefined, key: 'from' | 'to') => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: date || null,
      },
    }));
  };

  const resetFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      dateRange: { from: null, to: null },
      search: '',
    });
  };

  const hasActiveFilters = 
    filters.type !== 'all' || 
    filters.status !== 'all' ||
    (filters.dateRange?.from !== null && filters.dateRange?.from !== undefined) || 
    (filters.dateRange?.to !== null && filters.dateRange?.to !== undefined) ||
    !!filters.search;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search feedback..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="bug">Bug Reports</SelectItem>
                    <SelectItem value="feature">Feature Requests</SelectItem>
                    <SelectItem value="suggestion">Suggestions</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.dateRange.from && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.from ? (
                          format(filters.dateRange.from, 'PPP')
                        ) : (
                          <span>From</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from || undefined}
                        onSelect={(date) => handleDateSelect(date, 'from')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.dateRange.to && 'text-muted-foreground'
                        )}
                        disabled={!filters.dateRange.from}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.to ? (
                          format(filters.dateRange.to, 'PPP')
                        ) : (
                          <span>To</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to || undefined}
                        onSelect={(date) => handleDateSelect(date, 'to')}
                        initialFocus
                        disabled={(date) => 
                          filters.dateRange.from ? date < filters.dateRange.from : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
