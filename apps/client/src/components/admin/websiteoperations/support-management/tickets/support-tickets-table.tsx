'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { SupportTicket, SupportCategory, SupportStatus } from '../types';
import {
  Wrench,
  CreditCard,
  HelpCircle,
  Lightbulb,
  Bug,
  Mail,
  Eye
} from 'lucide-react';

const statusVariantMap: Record<SupportStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'open': 'default',
  'in-progress': 'secondary',
  'resolved': 'default',
  'closed': 'outline',
} as const;

const categoryIconMap: Record<SupportCategory, React.ComponentType<{ className?: string }>> = {
  technical: Wrench,
  billing: CreditCard,
  general: HelpCircle,
  'feature-request': Lightbulb,
  'bug-report': Bug,
} as const;

interface SupportTicketsTableProps {
  onViewTicket: (ticket: SupportTicket) => void;
  statusFilter?: SupportStatus;
  searchQuery?: string;
}

export function SupportTicketsTable({ onViewTicket, statusFilter, searchQuery = '' }: SupportTicketsTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Mock data - replace with actual API call
  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ['support-tickets', statusFilter, searchQuery, page],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock data - replace with actual API call
      return Array.from({ length: 10 }).map((_, i) => ({
        id: `TKT-${1000 + i}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        category: Object.keys(categoryIconMap)[i % 5] as SupportCategory,
        subject: `Support ticket #${i + 1} - ${['Login issue', 'Payment problem', 'Feature request', 'Bug report', 'General question'][i % 5]}`,
        message: 'This is a sample support ticket message. Please help me with this issue.',
        status: ['open', 'in-progress', 'resolved', 'closed'][i % 4] as SupportStatus,
        createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24 * (i % 5)),
        updatedAt: new Date(),
      }));
    },
  });

  const filteredTickets = tickets?.filter(ticket => {
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    const matchesSearch = searchQuery === '' ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const paginatedTickets = filteredTickets?.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!paginatedTickets || paginatedTickets.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium">No support tickets found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {statusFilter ? `No ${statusFilter} tickets.` : 'Get started by creating a new ticket.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTickets.map((ticket) => {
              return (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewTicket(ticket)}>
                  <TableCell className="font-medium">{ticket.id}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{ticket.subject}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {ticket.category.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[ticket.status]} className="capitalize">
                      {ticket.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(ticket.updatedAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      onViewTicket(ticket);
                    }}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
          <span className="font-medium">
            {Math.min(page * pageSize, filteredTickets?.length || 0)}
          </span>{' '}
          of <span className="font-medium">{filteredTickets?.length}</span> tickets
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={!filteredTickets || page * pageSize >= filteredTickets.length}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
