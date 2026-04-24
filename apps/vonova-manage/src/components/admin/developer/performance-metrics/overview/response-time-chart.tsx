'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveLine } from '@nivo/line';

const theme = {
  axis: {
    ticks: {
      text: {
        fill: 'hsl(var(--muted-foreground))',
        fontSize: 12,
      },
      line: {
        stroke: 'hsl(var(--border))',
        strokeWidth: 1,
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
      strokeDasharray: '3 3',
    },
  },
  tooltip: {
    container: {
      background: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'var(--radius)',
      padding: '12px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    },
  },
};

export function ResponseTimeChart({
  responseTimeSeries,
  requestVolumeSeries,
}: {
  responseTimeSeries: Array<{ x: string; xLabel: string; y: number }>;
  requestVolumeSeries: Array<{ x: string; xLabel: string; y: number }>;
}) {
  const data = [
    {
      id: 'responseTime',
      color: '#8884d8',
      data: responseTimeSeries.map((p) => ({ x: p.xLabel, y: p.y })),
    },
    {
      id: 'requests',
      color: '#82ca9d',
      data: requestVolumeSeries.map((p) => ({ x: p.xLabel, y: p.y })),
    },
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col space-y-1.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Response Time & Request Volume</CardTitle>
            <p className="text-sm text-muted-foreground">Last 24 hours performance metrics</p>
          </div>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6] mr-2" />
              <span className="text-xs text-muted-foreground">Response Time (ms)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#10b981] mr-2" />
              <span className="text-xs text-muted-foreground">Requests</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        <div className="h-full w-full">
          <ResponsiveLine
            data={data}
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
              legend: 'Time (UTC)',
              legendOffset: 36,
              legendPosition: 'middle',
              tickValues: 6,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Response Time (ms)',
              legendOffset: -50,
              legendPosition: 'middle',
              format: (value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value;
              },
            }}
            colors={{ datum: 'color' }}
            pointSize={6}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            enableGridX={false}
            enableGridY={true}
            enablePoints={false}
            enableArea={true}
            areaOpacity={0.1}
            enableSlices="x"
            useMesh={true}
            theme={theme}
            sliceTooltip={({ slice }) => (
              <div className="bg-background p-4 border rounded shadow-lg">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {slice.points[0].data.xFormatted}
                </div>
                <div className="space-y-2">
                  {slice.points.map((point) => (
                    <div key={point.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: point.color }}
                        />
                        <span className="text-sm font-medium">
                          {point.seriesId === 'responseTime' ? 'Response Time' : 'Requests'}
                        </span>
                      </div>
                      <span className="text-sm">
                        {point.seriesId === 'responseTime' 
                          ? `${point.data.yFormatted}ms` 
                          : new Intl.NumberFormat().format(Number(point.data.yFormatted))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
