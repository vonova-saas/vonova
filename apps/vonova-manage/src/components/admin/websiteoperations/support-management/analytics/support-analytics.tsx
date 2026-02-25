'use client';

import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Ticket as TicketIcon, 
  AlertTriangle as AlertTriangleIcon, 
  Clock as ClockIcon, 
  ThumbsUp as ThumbsUpIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  Minus as MinusIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Nivo charts with no SSR to avoid window is not defined errors
const ResponsiveBar = dynamic(
  () => import('@nivo/bar').then((m) => m.ResponsiveBar),
  { ssr: false }
);

const ResponsivePie = dynamic(
  () => import('@nivo/pie').then((m) => m.ResponsivePie),
  { ssr: false }
);

const ResponsiveLine = dynamic(
  () => import('@nivo/line').then((m) => m.ResponsiveLine),
  { ssr: false }
);

export function SupportAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['support-stats'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data - replace with actual API call
      return {
        totalTickets: 128,
        openTickets: 24,
        avgResponseTime: '2h 15m',
        satisfactionRate: 92,
        
        // Data for category distribution
        categories: [
          { id: 'technical', label: 'Technical', value: 42 },
          { id: 'billing', label: 'Billing', value: 28 },
          { id: 'general', label: 'General', value: 35 },
          { id: 'feature-request', label: 'Feature Request', value: 15 },
          { id: 'bug-report', label: 'Bug Report', value: 8 },
        ],
        
        // Data for status distribution
        status: [
          { id: 'open', label: 'Open', value: 24 },
          { id: 'in-progress', label: 'In Progress', value: 18 },
          { id: 'resolved', label: 'Resolved', value: 72 },
          { id: 'closed', label: 'Closed', value: 14 },
        ],
        
        // Data for response time trends (last 7 days)
        responseTimeTrend: [
          { id: 'avgResponseTime', data: [
            { x: 'Mon', y: 120 },
            { x: 'Tue', y: 95 },
            { x: 'Wed', y: 85 },
            { x: 'Thu', y: 110 },
            { x: 'Fri', y: 75 },
            { x: 'Sat', y: 140 },
            { x: 'Sun', y: 160 },
          ]},
        ],
        
        // Data for ticket volume (last 30 days)
        ticketVolume: [
          { id: 'tickets', data: Array.from({ length: 30 }, (_, i) => ({
            x: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            y: Math.floor(Math.random() * 20) + 5,
          }))},
        ],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Tickets" 
          value={stats.totalTickets.toLocaleString()}
          icon={<TicketIcon className="h-4 w-4 text-muted-foreground" />}
          description="All time"
        />
        <StatCard 
          title="Open Tickets" 
          value={stats.openTickets}
          icon={<AlertTriangleIcon className="h-4 w-4 text-amber-500" />}
          description="Requires attention"
          trend="up"
        />
        <StatCard 
          title="Avg. Response Time" 
          value={stats.avgResponseTime}
          icon={<ClockIcon className="h-4 w-4 text-blue-500" />}
          description="From ticket creation"
          trend="down"
        />
        <StatCard 
          title="Satisfaction Rate" 
          value={`${stats.satisfactionRate}%`}
          icon={<ThumbsUpIcon className="h-4 w-4 text-green-500" />}
          description="Based on surveys"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Volume (30 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveLine
              data={stats.ticketVolume}
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 0, max: 'auto', stacked: true, reverse: false }}
              curve="monotoneX"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Date',
                legendOffset: 40,
                legendPosition: 'middle',
                format: (value) => {
                  // Only show every 5th tick to prevent overlap
                  const index = stats.ticketVolume[0].data.findIndex(d => d.x === value);
                  return index % 5 === 0 ? value : '';
                },
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Number of Tickets',
                legendOffset: -50,
                legendPosition: 'middle',
                tickValues: 5,
              }}
              enableGridX={false}
              colors={['#3b82f6']}
              lineWidth={2}
              pointSize={4}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
              enableArea={true}
              areaOpacity={0.1}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsivePie
              data={stats.categories}
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
              arcLabelsTextColor={{
                from: 'color',
                modifiers: [['darker', 2]],
              }}
              defs={[
                {
                  id: 'dots',
                  type: 'patternDots',
                  background: 'inherit',
                  color: 'rgba(255, 255, 255, 0.3)',
                  size: 4,
                  padding: 1,
                  stagger: true,
                },
                {
                  id: 'lines',
                  type: 'patternLines',
                  background: 'inherit',
                  color: 'rgba(255, 255, 255, 0.3)',
                  rotation: -45,
                  lineWidth: 6,
                  spacing: 10,
                },
              ]}
              fill={[
                {
                  match: {
                    id: 'technical',
                  },
                  id: 'dots',
                },
                {
                  match: {
                    id: 'billing',
                  },
                  id: 'lines',
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveLine
              data={stats.responseTimeTrend}
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{
                type: 'linear',
                min: 0,
                max: 200,
                stacked: true,
                reverse: false,
              }}
              yFormat=" >-.2f"
              curve="monotoneX"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Day',
                legendOffset: 40,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Minutes',
                legendOffset: -50,
                legendPosition: 'middle',
                tickValues: 5,
              }}
              enableGridX={false}
              colors={['#10b981']}
              lineWidth={2}
              pointSize={8}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
              enableArea={true}
              areaOpacity={0.1}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveBar
              data={stats.status}
              keys={['value']}
              indexBy="label"
              margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={['#3b82f6', '#f59e0b', '#10b981', '#6b7280']}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Status',
                legendPosition: 'middle',
                legendOffset: 40,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Number of Tickets',
                legendPosition: 'middle',
                legendOffset: -50,
                tickValues: 5,
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              animate={true}
              motionConfig="gentle"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, icon, description, trend = 'neutral' }: StatCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  const trendIcons = {
    up: <ArrowUpIcon className="h-4 w-4" />,
    down: <ArrowDownIcon className="h-4 w-4" />,
    neutral: <MinusIcon className="h-4 w-4" />,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {trend !== 'neutral' && (
            <span className={`flex items-center mr-1 ${trendColors[trend]}`}>
              {trendIcons[trend]}
              {trend === 'up' ? '12.3%' : trend === 'down' ? '5.2%' : ''} from last month
            </span>
          )}
          {description}
        </div>
      </CardContent>
    </Card>
  );
}
