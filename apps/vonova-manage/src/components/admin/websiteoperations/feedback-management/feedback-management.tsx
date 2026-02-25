'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Feedback, FeedbackFilters as FeedbackFiltersType } from './types';
import { FeedbackList } from './feedback/feedback-list';
import { FeedbackResponseForm } from './feedback/feedback-response-form';
import { FeedbackAnalytics } from './analytics/feedback-analytics';
import { FeedbackFilters } from './feedback/feedback-filters';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Filter, BarChart2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_FEEDBACK } from './mockdata';

// Generate mock analytics data
const generateMockAnalytics = (feedback: Feedback[]) => {
  const now = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  return {
    total: feedback.length,
    new: feedback.filter(f => f.status === 'new').length,
    inProgress: feedback.filter(f => f.status === 'in_progress').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
    rejected: feedback.filter(f => f.status === 'rejected').length,
    byType: {
      bug: feedback.filter(f => f.type === 'bug').length,
      feature: feedback.filter(f => f.type === 'feature').length,
      suggestion: feedback.filter(f => f.type === 'suggestion').length,
      other: feedback.filter(f => f.type === 'other').length,
    },
    byDate: last30Days.map(date => ({
      date,
      count: feedback.filter(f => f.metadata.timestamp.startsWith(date)).length,
    })),
  };
};

export default function FeedbackManagement() {
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [activeTab, setActiveTab] = useState('feedback');

  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [filters, setFilters] = useState<FeedbackFiltersType>({
    type: 'all',
    status: 'all',
    search: '',
  });

  // Load mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setFeedback(MOCK_FEEDBACK);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Filter feedback based on filters
  const filteredFeedback = feedback.filter(item => {
    // Filter by type
    if (filters.type !== 'all' && item.type !== filters.type) {
      return false;
    }

    // Filter by status
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesMessage = item.message.toLowerCase().includes(searchLower);
      const matchesEmail = item.contactEmail?.toLowerCase().includes(searchLower) || false;

      if (!matchesMessage && !matchesEmail) {
        return false;
      }
    }

    // Filter by date range
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const itemDate = new Date(item.metadata.timestamp);

      if (filters.dateRange.from && itemDate < filters.dateRange.from) {
        return false;
      }

      if (filters.dateRange.to) {
        // Set to end of day for the to date
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999);

        if (itemDate > toDate) {
          return false;
        }
      }
    }

    return true;
  });

  // Handle feedback selection
  const handleSelectFeedback = useCallback((feedback: Feedback) => {
    setSelectedFeedback(feedback);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedFeedback(null);
  }, []);

  // Handle sending a response to feedback
  const handleSendResponse = useCallback(async (data: { status: Feedback['status']; response: string }) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // In a real app, this would be an API call to update the feedback
      setFeedback(prev =>
        prev.map(item =>
          item.id === selectedFeedback?.id
            ? {
              ...item,
              status: data.status,
              response: data.response,
              respondedAt: new Date().toISOString(),
              respondedBy: 'admin@example.com', // In a real app, this would be the current admin user
            }
            : item
        )
      );

      toast.success('Response submitted successfully');
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFeedback]);

  // Generate analytics data
  const analyticsData = generateMockAnalytics(feedback);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (selectedFeedback) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={handleBackToList}
          className="mb-4"
        >
          ← Back to feedback list
        </Button>
        <FeedbackResponseForm
          feedback={selectedFeedback}
          onBack={handleBackToList}
          onSubmit={handleSendResponse}
          isSubmitting={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Feedback Management</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Review and respond to user feedback and suggestions
          </p>
        </div>
      </div>

      <Tabs 
        defaultValue="feedback" 
        value={activeTab} 
        onValueChange={(value: string) => setActiveTab(value)} 
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackFilters
            onFilterChange={setFilters}
            initialFilters={filters}
          />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Feedback</CardTitle>
                  <CardDescription>
                    {filteredFeedback.length} {filteredFeedback.length === 1 ? 'item' : 'items'} found
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    <Download className="mr-2 h-4 w-4" />
                    Columns
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FeedbackList
                feedback={filteredFeedback}
                onSelectFeedback={handleSelectFeedback}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <FeedbackAnalytics
            stats={analyticsData}
            isLoading={isLoading}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription>
                  Most recent user feedback items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="border-b pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium line-clamp-1">
                            {item.contactEmail || 'Anonymous User'}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.message}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectFeedback(item)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback Status</CardTitle>
                <CardDescription>
                  Distribution of feedback by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries({
                    new: 'New',
                    in_progress: 'In Progress',
                    resolved: 'Resolved',
                    rejected: 'Rejected',
                  }).map(([status, label]) => {
                    const count = feedback.filter(f => f.status === status).length;
                    const percentage = feedback.length > 0
                      ? Math.round((count / feedback.length) * 100)
                      : 0;

                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{label}</span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${status === 'new' ? 'bg-blue-500' :
                              status === 'in_progress' ? 'bg-yellow-500' :
                                status === 'resolved' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}