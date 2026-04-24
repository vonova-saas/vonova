'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveLine } from '@nivo/line';

export function ApiMetrics({
  data,
}: {
  data?: {
    successRate: number;
    avgResponseMs: number;
    requests: number;
    apiPerformanceSeries: Array<{
      id: string;
      color: string;
      data: Array<{ x: string; y: number }>;
    }>;
    endpointPerformance: Array<{
      endpoint: string;
      avgTimeMs: number;
      successRate: number;
      calls: number;
    }>;
    recentErrors: Array<{
      time: string;
      method: string;
      endpoint: string;
      status: number;
      message: string;
    }>;
  };
}) {
  const apiData = data?.apiPerformanceSeries ?? [];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.successRate ?? 0).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Selected range success ratio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data?.avgResponseMs ?? 0)}ms</div>
            <p className="text-xs text-muted-foreground">Derived from event response times</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Requests (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat().format(data?.requests ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Request volume in selected range</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <div className="h-full w-full">
            <ResponsiveLine
              data={apiData}
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{
                type: 'linear',
                min: 0,
                max: 100,
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
                legend: 'Rate (%)',
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.endpointPerformance ?? []).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="w-1/3 truncate">{item.endpoint}</div>
                  <div className="w-1/4 text-right">{item.avgTimeMs}ms</div>
                  <div className="w-1/4 text-right">{item.successRate.toFixed(1)}%</div>
                  <div className="w-1/4 text-right">{new Intl.NumberFormat().format(item.calls)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.recentErrors ?? []).map((error, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{error.method} {error.endpoint}</span>
                    <span className="text-xs text-muted-foreground">{new Date(error.time).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      error.status >= 500 ? 'bg-red-100 text-red-800' : 
                      error.status >= 400 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {error.status}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">{error.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
