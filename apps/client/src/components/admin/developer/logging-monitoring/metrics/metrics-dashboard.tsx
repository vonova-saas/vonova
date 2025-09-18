'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { TimeRange } from "../types";

// Mock data generation functions
const generateTimeSeriesData = (points: number, days: number) => {
  const now = new Date();
  const data = [];
  
  for (let i = 0; i < points; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days * (1 - i / points)));
    
    data.push({
      x: date,
      y: Math.floor(Math.random() * 100) + 20,
    });
  }
  
  return data;
};

interface MetricsDashboardProps {
  timeRange: TimeRange;
  customDate?: Date;
}

export function MetricsDashboard({ timeRange }: MetricsDashboardProps) {
  // In a real app, this data would come from an API
  const responseTimeData = {
    id: 'Response Time',
    data: generateTimeSeriesData(20, timeRange === '1h' ? 0.04 : timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30)
  };

  const errorRateData = {
    id: 'Error Rate',
    data: generateTimeSeriesData(20, timeRange === '1h' ? 0.04 : timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30)
  };

  const requestCountData = {
    id: 'Requests',
    data: generateTimeSeriesData(20, timeRange === '1h' ? 0.04 : timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30)
  };

  const pieData = [
    { id: '2xx', label: '2xx', value: 85, color: 'hsl(142.1, 76.2%, 36.3%)' },
    { id: '3xx', label: '3xx', value: 5, color: 'hsl(38, 92%, 50%)' },
    { id: '4xx', label: '4xx', value: 7, color: 'hsl(24, 94%, 50%)' },
    { id: '5xx', label: '5xx', value: 3, color: 'hsl(0, 84.2%, 60.2%)' },
  ];

  const commonChartProps = {
    margin: { top: 20, right: 30, bottom: 50, left: 50 },
    xScale: {
      type: 'time',
      format: '%Y-%m-%d',
      useUTC: false,
      precision: 'minute',
    } as const,
    xFormat: 'time:%Y-%m-%d %H:%M' as const,
    curve: 'monotoneX' as const,
    enablePoints: false,
    enableArea: true,
    areaOpacity: 0.1,
    lineWidth: 2,
    useMesh: true,
    theme: {
      axis: {
        ticks: {
          line: {
            stroke: 'hsl(var(--border))',
          },
          text: {
            fill: 'hsl(var(--muted-foreground))',
            fontSize: 11,
          },
        },
        legend: {
          text: {
            fill: 'hsl(var(--muted-foreground))',
            fontSize: 12,
          },
        },
      },
      grid: {
        line: {
          stroke: 'hsl(var(--border))',
          strokeWidth: 1,
          strokeDasharray: '4 2',
        },
      },
      tooltip: {
        container: {
          background: 'hsl(var(--popover))',
          color: 'hsl(var(--popover-foreground))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius)',
          padding: '8px 12px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
  };

  const formatTimeAxis = (value: string) => {
    const date = new Date(value);
    if (timeRange === '1h') return format(date, 'HH:mm');
    if (timeRange === '24h') return format(date, 'HH:mm');
    if (timeRange === '7d') return format(date, 'MMM dd');
    return format(date, 'MMM dd');
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard 
          title="Response Time"
          value="142ms"
          change={-5.2}
          icon={<span className="h-4 w-4 rounded-full bg-blue-500" />}
          chartData={responseTimeData.data}
        />
        <MetricCard 
          title="Error Rate"
          value="2.3%"
          change={0.5}
          icon={<span className="h-4 w-4 rounded-full bg-red-500" />}
          chartData={errorRateData.data}
        />
        <MetricCard 
          title="Requests"
          value="1.2K"
          change={12.5}
          icon={<span className="h-4 w-4 rounded-full bg-green-500" />}
          chartData={requestCountData.data}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Response Time (ms)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveLine
              {...commonChartProps}
              data={[responseTimeData]}
              yScale={{
                type: 'linear',
                min: 0,
                max: 200,
                stacked: false,
              }}
              axisBottom={{
                format: formatTimeAxis,
                tickValues: 5,
              }}
              axisLeft={{
                legend: 'ms',
                legendOffset: -40,
                legendPosition: 'middle',
              }}
              colors={['hsl(var(--primary))']}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <div className="h-full w-full">
              <ResponsivePie
                data={pieData}
                margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{
                  from: 'color',
                  modifiers: [['darker', 0.2]]
                }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="hsl(var(--muted-foreground))"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="hsl(var(--background))"
                colors={pieData.map(d => d.color)}
                theme={commonChartProps.theme}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Error Rate (%)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveLine
            {...commonChartProps}
            data={[errorRateData]}
            yScale={{
              type: 'linear',
              min: 0,
              max: 10,
              stacked: false,
            }}
            axisBottom={{
              format: formatTimeAxis,
              tickValues: 5,
            }}
            axisLeft={{
              legend: '%',
              legendOffset: -40,
              legendPosition: 'middle',
              tickValues: 5,
            }}
            colors={['hsl(var(--destructive))']}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  chartData: Array<{ x: Date; y: number }>;
}

function MetricCard({ title, value, change, icon, chartData }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`mt-1 text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '+' : ''}{change}% from last period
        </div>
        <div className="h-16 w-full mt-2">
          <ResponsiveLine
            data={[{
              id: 'value',
              data: chartData
            }]}
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
            xScale={{ type: 'point' }}
            yScale={{
              type: 'linear',
              min: 0,
              max: 'auto',
              stacked: false,
            }}
            curve="monotoneX"
            axisTop={null}
            axisRight={null}
            axisBottom={null}
            axisLeft={null}
            enableGridX={false}
            enableGridY={false}
            enablePoints={false}
            colors={[change >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))']}
            lineWidth={2}
            isInteractive={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function format(date: Date, formatStr: string): string {
  // This is a simplified version. In a real app, use date-fns or similar
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
