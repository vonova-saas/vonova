'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Bell, Clock, CheckCircle } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedbackStats } from '../types';

// Client-side only components

interface FeedbackAnalyticsProps {
  stats?: FeedbackStats;
  isLoading: boolean;
}

export function FeedbackAnalytics({ stats, isLoading }: FeedbackAnalyticsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feedback Analytics</CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feedback Analytics</CardTitle>
          <CardDescription>No analytics data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { total, new: newCount, inProgress, resolved, rejected, byType, byDate } = stats;

  const statusData = [
    { id: 'New', label: 'New', value: newCount, color: 'hsl(221, 83%, 53%)' },
    { id: 'In Progress', label: 'In Progress', value: inProgress, color: 'hsl(45, 93%, 47%)' },
    { id: 'Resolved', label: 'Resolved', value: resolved, color: 'hsl(142, 76%, 36%)' },
    { id: 'Rejected', label: 'Rejected', value: rejected, color: 'hsl(0, 84%, 60%)' },
  ];

  const typeData = Object.entries(byType).map(([type, count]) => ({
    id: type.charAt(0).toUpperCase() + type.slice(1),
    label: type,
    value: count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Analytics</CardTitle>
        <CardDescription>Overview of feedback statistics and trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Feedback"
            value={total}
            icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            title="New"
            value={newCount}
            trend="12% from last month"
            icon={<Bell className="h-4 w-4 text-blue-500" />}
          />
          <StatCard
            title="In Progress"
            value={inProgress}
            trend="3% from last month"
            icon={<Clock className="h-4 w-4 text-yellow-500" />}
          />
          <StatCard
            title="Resolved"
            value={resolved}
            trend="8% from last month"
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          />
        </div>

        <Tabs defaultValue="status" className="mt-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="status">By Status</TabsTrigger>
              <TabsTrigger value="type">By Type</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="status" className="mt-4">
            <div className="h-[300px] w-full">
              <ResponsivePie
                data={statusData}
                margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{
                  from: 'color',
                  modifiers: [['darker', 0.2]],
                }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="white"
                valueFormat=" >-~%"
                colors={['#3b82f6', '#eab308', '#22c55e', '#ef4444']}
                tooltip={({ datum }) => (
                  <div className="bg-background p-2 border rounded shadow-lg text-sm">
                    <div className="font-medium">{datum.label}</div>
                    <div>{datum.value} feedback items</div>
                    <div>{((datum.value / total) * 100).toFixed(1)}% of total</div>
                  </div>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="type" className="mt-4">
            <div className="h-[300px] w-full">
              <ResponsiveBar
                data={typeData}
                keys={['value']}
                indexBy="id"
                margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Feedback Type',
                  legendPosition: 'middle',
                  legendOffset: 40,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Count',
                  legendPosition: 'middle',
                  legendOffset: -50,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor="white"
                tooltip={({ data }) => (
                  <div className="bg-background p-2 border rounded shadow-lg text-sm">
                    <div className="font-medium">{data.id}</div>
                    <div>{data.value} feedback items</div>
                    <div>{((data.value as number / total) * 100).toFixed(1)}% of total</div>
                  </div>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            <div className="h-[300px] w-full">
              <ResponsiveBar
                data={byDate}
                keys={['count']}
                indexBy="date"
                margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={['#3b82f6']}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Date',
                  legendPosition: 'middle',
                  legendOffset: 40,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Feedback Count',
                  legendPosition: 'middle',
                  legendOffset: -50,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                tooltip={({ data }) => (
                  <div className="bg-background p-2 border rounded shadow-lg text-sm">
                    <div className="font-medium">{data.date}</div>
                    <div>{data.count} feedback items</div>
                  </div>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  description
}: {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">{trend}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
