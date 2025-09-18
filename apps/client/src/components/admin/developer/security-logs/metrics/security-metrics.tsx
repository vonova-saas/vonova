'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { AlertCircle, Shield, AlertTriangle, Lock } from 'lucide-react';

const barData = [
  { month: 'Jan', high: 4, medium: 2, low: 1 },
  { month: 'Feb', high: 3, medium: 1, low: 2 },
  { month: 'Mar', high: 2, medium: 3, low: 1 },
  { month: 'Apr', high: 5, medium: 2, low: 1 },
  { month: 'May', high: 3, medium: 4, low: 2 },
  { month: 'Jun', high: 6, medium: 3, low: 1 },
];

const pieData = [
  { id: 'SQL Injection', label: 'SQL Injection', value: 24 },
  { id: 'XSS Attempts', label: 'XSS Attempts', value: 18 },
  { id: 'Brute Force', label: 'Brute Force', value: 15 },
  { id: 'CORS Issues', label: 'CORS Issues', value: 32 },
  { id: 'Other', label: 'Other', value: 7 },
];

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const attackTypes = [
  { name: 'SQL Injection', count: 24, trend: 'up', change: 12 },
  { name: 'XSS Attempts', count: 18, trend: 'down', change: 5 },
  { name: 'Brute Force', count: 15, trend: 'up', change: 8 },
  { name: 'CORS Issues', count: 32, trend: 'up', change: 15 },
  { name: 'Other', count: 7, trend: 'down', change: 3 },
];

const riskMetrics = [
  { name: 'High Risk', value: 12, icon: AlertCircle, color: 'bg-red-500' },
  { name: 'Medium Risk', value: 24, icon: AlertTriangle, color: 'bg-yellow-500' },
  { name: 'Low Risk', value: 45, icon: Shield, color: 'bg-blue-500' },
  { name: 'Blocked', value: 132, icon: Lock, color: 'bg-green-500' },
];

export function SecurityMetrics() {
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
                +20.1% from last month
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
              data={barData}
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
              data={pieData}
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
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <div>
                    <p className="text-sm font-medium">Potential SQL Injection Attempt</p>
                    <p className="text-xs text-muted-foreground">From 192.168.1.1 on /api/users</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">2 minutes ago</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
