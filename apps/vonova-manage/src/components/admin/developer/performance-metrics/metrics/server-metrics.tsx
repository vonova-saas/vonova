'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveLine } from '@nivo/line';

export function ServerMetrics({
  data,
}: {
  data?: {
    status: 'operational' | 'degraded' | 'outage';
    uptimeSeconds: number;
    activeProcesses: number;
    errorRate: number;
    performanceSeries: Array<{
      id: string;
      color: string;
      data: Array<{ x: string; y: number }>;
    }>;
  };
}) {
  const serverData = data?.performanceSeries ?? [];
  const uptimeText = data?.uptimeSeconds
    ? `${Math.floor(data.uptimeSeconds / 86400)}d ${Math.floor((data.uptimeSeconds % 86400) / 3600)}h ${Math.floor((data.uptimeSeconds % 3600) / 60)}m`
    : 'N/A';
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${data?.status === 'operational' ? 'bg-green-500' : data?.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {data?.status === 'operational'
                  ? 'All systems operational'
                  : data?.status === 'degraded'
                    ? 'System degraded'
                    : 'System outage'}
              </span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Uptime: {uptimeText}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeProcesses ?? 0}</div>
            <p className="text-xs text-muted-foreground">Current running processes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.errorRate ?? 0).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Selected range error ratio</p>
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
