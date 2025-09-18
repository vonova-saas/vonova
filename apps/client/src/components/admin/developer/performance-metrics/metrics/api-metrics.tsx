'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveLine } from '@nivo/line';

const apiData = [
  {
    id: 'success',
    color: '#10b981',
    data: [
      { x: '00:00', y: 95.2 },
      { x: '04:00', y: 96.1 },
      { x: '08:00', y: 94.8 },
      { x: '12:00', y: 93.5 },
      { x: '16:00', y: 95.8 },
      { x: '20:00', y: 96.3 },
      { x: '23:59', y: 97.1 },
    ],
  },
  {
    id: 'error',
    color: '#ef4444',
    data: [
      { x: '00:00', y: 1.2 },
      { x: '04:00', y: 0.8 },
      { x: '08:00', y: 1.5 },
      { x: '12:00', y: 2.1 },
      { x: '16:00', y: 1.3 },
      { x: '20:00', y: 0.9 },
      { x: '23:59', y: 0.7 },
    ],
  },
];

export function ApiMetrics() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97.8%</div>
            <p className="text-xs text-muted-foreground">+0.4% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142ms</div>
            <p className="text-xs text-muted-foreground">-12ms from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Requests (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4M</div>
            <p className="text-xs text-muted-foreground">+120K from yesterday</p>
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
              {[
                { endpoint: '/api/products', avgTime: '86ms', successRate: '99.2%', calls: '245K' },
                { endpoint: '/api/orders', avgTime: '142ms', successRate: '98.7%', calls: '189K' },
                { endpoint: '/api/users', avgTime: '92ms', successRate: '99.5%', calls: '156K' },
                { endpoint: '/api/search', avgTime: '215ms', successRate: '97.8%', calls: '432K' },
                { endpoint: '/api/auth', avgTime: '78ms', successRate: '99.8%', calls: '312K' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="w-1/3 truncate">{item.endpoint}</div>
                  <div className="w-1/4 text-right">{item.avgTime}</div>
                  <div className="w-1/4 text-right">{item.successRate}</div>
                  <div className="w-1/4 text-right">{item.calls}</div>
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
              {[
                { 
                  time: '2m ago', 
                  method: 'POST', 
                  endpoint: '/api/checkout', 
                  status: 500, 
                  message: 'Internal server error' 
                },
                { 
                  time: '15m ago', 
                  method: 'GET', 
                  endpoint: '/api/products/123', 
                  status: 404, 
                  message: 'Product not found' 
                },
                { 
                  time: '32m ago', 
                  method: 'PUT', 
                  endpoint: '/api/users/456', 
                  status: 403, 
                  message: 'Forbidden' 
                },
                { 
                  time: '1h ago', 
                  method: 'POST', 
                  endpoint: '/api/upload', 
                  status: 400, 
                  message: 'Invalid file type' 
                },
              ].map((error, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{error.method} {error.endpoint}</span>
                    <span className="text-xs text-muted-foreground">{error.time}</span>
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
