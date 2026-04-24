'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { AlertCircle, Shield, AlertTriangle, Lock } from 'lucide-react';

const colors = {
  'high': '#ef4444',
  'medium': '#f59e0b',
  'low': '#3b82f6',
  'SQL Injection': '#ef4444',
  'XSS Attempts': '#f59e0b',
  'Brute Force': '#3b82f6',
  'CORS Issues': '#8b5cf6',
  'Other': '#6b7280'
};

export function SecurityMetrics({
  metrics,
  summary,
  isLoading = false,
}: {
  metrics?: {
    riskCards: { high: number; medium: number; low: number; blocked: number };
    eventsSeries: Array<{ label: string; high: number; medium: number; low: number }>;
    attackTypes: Array<{ id: string; label: string; value: number }>;
  };
  summary?: { totalEvents: number };
  isLoading?: boolean;
}) {
  const riskMetrics = [
    { name: 'High Risk', value: metrics?.riskCards.high ?? 0, icon: AlertCircle },
    { name: 'Medium Risk', value: metrics?.riskCards.medium ?? 0, icon: AlertTriangle },
    { name: 'Low Risk', value: metrics?.riskCards.low ?? 0, icon: Shield },
    { name: 'Blocked', value: metrics?.riskCards.blocked ?? 0, icon: Lock },
  ];
  const barData =
    metrics?.eventsSeries.map((it) => ({
      month: it.label,
      high: it.high,
      medium: it.medium,
      low: it.low,
    })) ?? [];
  const pieData = metrics?.attackTypes ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {riskMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Loading...' : `${summary?.totalEvents ?? 0} total events`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Security Events</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveBar
              data={barData.length ? barData : [{ month: 'N/A', high: 0, medium: 0, low: 0 }]}
              keys={['high', 'medium', 'low']}
              indexBy="month"
              margin={{ top: 20, right: 80, bottom: 60, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={({ id }) => colors[id as keyof typeof colors] || '#000'}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Month',
                legendPosition: 'middle',
                legendOffset: 40,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Number of Events',
                legendPosition: 'middle',
                legendOffset: -50,
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor="white"
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 12,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
              animate={true}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attack Types</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsivePie
              data={pieData.length ? pieData : [{ id: 'No Data', label: 'No Data', value: 1 }]}
              margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor="white"
              colors={({ id }) => colors[id as keyof typeof colors] || '#000'}
              tooltip={({ datum: { id, value, color } }) => (
                <div className="bg-white p-2 rounded shadow-lg border border-gray-200">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    />
                    <strong>{id}</strong>
                  </div>
                  <div className="text-sm text-gray-600">
                    {value} events
                  </div>
                </div>
              )}
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: '#999',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 12,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: '#000'
                      }
                    }
                  ]
                }
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(barData.length ? barData.slice(-5).reverse() : []).map((item) => (
              <div key={item.month} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <div>
                    <p className="text-sm font-medium">Security bucket {item.month}</p>
                    <p className="text-xs text-muted-foreground">
                      High: {item.high}, Medium: {item.medium}, Low: {item.low}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Recent</span>
              </div>
            ))}
            {!barData.length && (
              <div className="text-sm text-muted-foreground">No recent security events.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
