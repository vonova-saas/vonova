/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bug, Lightbulb, MessageSquare, AlertTriangle, ArrowUpDown, ChevronUp, ChevronDown, Loader2, Inbox, ArrowUpNarrowWide, Eye } from 'lucide-react';
import { Feedback } from '../types';
import { cn } from '@/utils/functions';

interface FeedbackListProps {
  feedback: Feedback[];
  onSelectFeedback: (feedback: Feedback) => void;
  selectedFeedbackId?: string;
  className?: string;
  isLoading?: boolean;
}

const typeIcons = {
  bug: <Bug className="h-4 w-4 text-red-500" />,
  feature: <Lightbulb className="h-4 w-4 text-blue-500" />,
  suggestion: <MessageSquare className="h-4 w-4 text-yellow-500" />,
  other: <AlertTriangle className="h-4 w-4 text-purple-500" />,
};

const statusVariants = {
  new: { label: 'New', variant: 'outline' as const, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'In Progress', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  resolved: { label: 'Resolved', variant: 'outline' as const, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: 'Rejected', variant: 'outline' as const, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

export function FeedbackList({
  feedback,
  onSelectFeedback,
  selectedFeedbackId,
  className = '',
  isLoading = false
}: FeedbackListProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Feedback; direction: 'asc' | 'desc' }>({
    key: 'metadata',
    direction: 'desc',
    // getValue: (item: Feedback) => new Date(item.metadata.timestamp).getTime()
  });

  const handleSort = (key: keyof Feedback) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedFeedback = [...feedback].sort((a, b) => {
    let aValue: any = a[sortConfig.key as keyof typeof a];
    let bValue: any = b[sortConfig.key as keyof typeof b];

    // Handle nested metadata sorting
    if (sortConfig.key === 'metadata' && sortConfig.key in a && sortConfig.key in b) {
      aValue = new Date(a.metadata.timestamp).getTime();
      bValue = new Date(b.metadata.timestamp).getTime();
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const SortIndicator = ({ columnKey }: { columnKey: keyof Feedback }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-1 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No feedback found</h3>
        <p className="text-sm text-muted-foreground">
          There&apos;s no feedback to display at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('type' as keyof Feedback)}
            >
              <div className="flex items-center">
                Type
                <ArrowUpNarrowWide className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Message</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('status' as keyof Feedback)}
            >
              <div className="flex items-center">
                Status
                <ArrowUpNarrowWide className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('metadata' as keyof Feedback)}
            >
              <div className="flex items-center">
                Date
                <ArrowUpNarrowWide className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFeedback.map((item) => (
            <TableRow
              key={item.id}
              className={cn(
                'cursor-pointer hover:bg-muted/50',
                selectedFeedbackId === item.id && 'bg-muted/30'
              )}
              onClick={() => onSelectFeedback(item)}
            >
              <TableCell className="py-3">
                <div className="flex items-center">
                  <span className="mr-2">{typeIcons[item.type]}</span>
                  <span className="capitalize">{item.type}</span>
                </div>
              </TableCell>
              <TableCell className="py-3 max-w-[300px] truncate">
                <div className="truncate" title={item.message}>
                  {item.message}
                </div>
                {item.contactEmail && (
                  <div className="text-xs text-muted-foreground truncate">
                    {item.contactEmail}
                  </div>
                )}
              </TableCell>
              <TableCell className="py-3">
                <Badge
                  variant={statusVariants[item.status].variant}
                  className={cn(
                    'capitalize',
                    statusVariants[item.status].color
                  )}
                >
                  {statusVariants[item.status].label}
                </Badge>
              </TableCell>
              <TableCell className="py-3 text-sm text-muted-foreground">
                {format(new Date(item.metadata.timestamp), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFeedback(item);
                  }}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View details</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
