'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveLine } from '@nivo/line';

const serverData = [
  {
    id: 'cpu',
    color: '#8884d8',
    data: [
      { x: '00:00', y: 35 },
      { x: '04:00', y: 30 },
      { x: '08:00', y: 55 },
      { x: '12:00', y: 70 },
      { x: '16:00', y: 65 },
      { x: '20:00', y: 50 },
      { x: '23:59', y: 40 },
    ],
  },
  {
    id: 'memory',
    color: '#82ca9d',
    data: [
      { x: '00:00', y: 45 },
      { x: '04:00', y: 42 },
      { x: '08:00', y: 65 },
      { x: '12:00', y: 75 },
      { x: '16:00', y: 70 },
      { x: '20:00', y: 60 },
      { x: '23:59', y: 50 },
    ],
  },
  {
    id: 'connections',
    color: '#ffc658',
    data: [
      { x: '00:00', y: 120 },
      { x: '04:00', y: 110 },
      { x: '08:00', y: 320 },
      { x: '12:00', y: 480 },
      { x: '16:00', y: 420 },
      { x: '20:00', y: 350 },
      { x: '23:59', y: 180 },
    ],
  },
];

export function ServerMetrics() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">All systems operational</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Uptime: 15d 6h 23m
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.12%</div>
            <p className="text-xs text-muted-foreground">-0.03% from yesterday</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Server Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <div className="h-full w-full">
            <ResponsiveLine
              data={serverData}
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{
                type: 'linear',
                min: 0,
                max: 'auto',
                stacked: false,
              }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Time',
                legendOffset: 36,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Usage (%)',
                legendOffset: -50,
                legendPosition: 'middle',
                format: (value) => `${value}%`,
              }}
              colors={{ datum: 'color' }}
              pointSize={8}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              useMesh={true}
              enableArea={true}
              areaOpacity={0.2}
              enableSlices="x"
              sliceTooltip={({ slice }) => (
                <div className="bg-background p-4 border rounded shadow-lg">
                  <div className="font-bold mb-2">
                    {slice.points[0].data.xFormatted}
                  </div>
                  {slice.points.map((point) => (
                    <div key={point.id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: point.color }}
                      />
                      <span className="font-medium">{point.seriesId}:</span>
                      <span>{point.data.yFormatted}%</span>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
