'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveBar } from '@nivo/bar';

const barColors = {
  'Queries': '#8884d8',
  'Slow Queries': '#ff4d4f',
  'Connections': '#ffc658',
};

export function DatabaseMetrics({
  data,
}: {
  data?: {
    databaseSizeGb: number;
    queryCacheHitRate: number;
    activeConnections: number;
    maxConnections: number;
    replicationLagSeconds: number;
    performanceSeries: Array<{
      time: string;
      queries: number;
      slowQueries: number;
      connections: number;
    }>;
  };
}) {
  const barData = (data?.performanceSeries ?? []).map((item) => ({
    time: item.time,
    Queries: item.queries,
    'Slow Queries': item.slowQueries,
    Connections: item.connections,
  }));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.databaseSizeGb ?? 0).toFixed(2)} GB</div>
            <p className="text-xs text-muted-foreground">Estimated active dataset size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Query Cache Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.queryCacheHitRate ?? 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Computed from request/error mix</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeConnections ?? 0}</div>
            <p className="text-xs text-muted-foreground">Max: {data?.maxConnections ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Replication Lag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data?.replicationLagSeconds ?? 0).toFixed(2)}s</div>
            <p className="text-xs text-muted-foreground">Replica synchronization delay</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Database Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <div className="h-full w-full">
            <ResponsiveBar
              data={barData}
              keys={['Queries', 'Slow Queries', 'Connections']}
              indexBy="time"
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={({ id }) => barColors[id as keyof typeof barColors]}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Time',
                legendPosition: 'middle',
                legendOffset: 35,
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
              labelTextColor="#fff"
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
                        itemBackground: 'rgba(0, 0, 0, .03)',
                        itemOpacity: 1,
                      },
                    },
                  ],
                },
              ]}
              tooltip={({ id, value, color }) => (
                <div className="bg-background p-2 border rounded shadow-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium">{id}:</span>
                    <span>{value}</span>
                  </div>
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
