/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SupportTicketsTable } from './tickets/support-tickets-table';
import { SupportAnalytics } from './analytics/support-analytics';
import { TicketDetails } from './tickets/ticket-details';
import { SupportTicket } from './types';
import { BarChart2, Download, Plus, RefreshCw, Search, Ticket } from 'lucide-react';

export default function SupportManagement() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tickets');

  // Mock data fetching - replace with actual API calls
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock data - replace with actual API call
      return Array.from({ length: 15 }).map((_, i) => ({
        id: `TKT-${1000 + i}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        category: ['technical', 'billing', 'general', 'feature-request', 'bug-report'][i % 5] as any,
        subject: `Support ticket #${i + 1} - ${['Login issue', 'Payment problem', 'Feature request', 'Bug report', 'General question'][i % 5]}`,
        message: 'This is a sample support ticket message. Please help me with this issue.'.repeat(2),
        status: ['open', 'in-progress', 'resolved', 'closed'][i % 4] as any,
        priority: ['low', 'medium', 'high'][i % 3] as any,
        createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24 * (i % 5)),
        updatedAt: new Date(),
        responses: i % 3 === 0 ? [{
          id: `resp-${i}`,
          userId: 'admin-1',
          userName: 'Admin User',
          userRole: 'admin',
          message: 'Thank you for reaching out. We are looking into this issue and will get back to you soon.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        }] : [],
      }));
    },
  });

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    // TODO: Implement status update API call
    console.log(`Updating ticket ${ticketId} status to ${status}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  };

  const handleSendResponse = async (ticketId: string, message: string) => {
    // TODO: Implement send response API call
    console.log(`Sending response to ticket ${ticketId}:`, message);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  };

  if (selectedTicket) {
    return (
      <TicketDetails
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
        onUpdateStatus={async (status) => {
          const success = await handleUpdateStatus(selectedTicket.id, status);
          if (success) {
            setSelectedTicket(prev => prev ? { ...prev, status } : null);
          }
        }}
        onSendResponse={async (message) => {
          const response = await handleSendResponse(selectedTicket.id, message);
          if (response.success) {
            // In a real app, you would refetch the ticket data
            setSelectedTicket(prev => {
              if (!prev) return null;
              return {
                ...prev,
                responses: [
                  ...(prev.responses || []),
                  {
                    id: `resp-${Date.now()}`,
                    userId: 'current-user-id',
                    userName: 'You',
                    userRole: 'admin',
                    message,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }
                ]
              };
            });
          }
          return response;
        }}
        isSubmitting={false}
      />
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Support Management</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Manage and respond to customer support tickets
          </p>
        </div>
      </div>

      <Tabs defaultValue="tickets" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {activeTab === 'tickets' && (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tickets..."
                  className="pl-8 w-[200px] lg:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}
        </div>

        <TabsContent value="tickets" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>
                    View and manage customer support tickets
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="h-8">
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SupportTicketsTable
                onViewTicket={setSelectedTicket}
                statusFilter={statusFilter as any}
                searchQuery={searchQuery}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <SupportAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
