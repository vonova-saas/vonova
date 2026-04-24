'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { MetricsChartsProps } from "../types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MetricsCharts({ timeRange, customDate, responseTimeData, errorRateData, requestStatus }: MetricsChartsProps) {
  const responseTimeSeries = {
    id: 'Response Time',
    data: responseTimeData.map((d) => ({ x: new Date(d.x), y: d.y }))
  };

  const errorRateSeries = {
    id: 'Error Rate',
    data: errorRateData.map((d) => ({ x: new Date(d.x), y: d.y }))
  };

  const pieData = [
    { id: 'Success', label: 'Success', value: requestStatus.success, color: 'hsl(142.1, 76.2%, 36.3%)' },
    { id: 'Client Errors', label: '4xx', value: requestStatus.clientErrors, color: 'hsl(38, 92%, 50%)' },
    { id: 'Server Errors', label: '5xx', value: requestStatus.serverErrors, color: 'hsl(0, 84.2%, 60.2%)' },
    { id: 'Timeouts', label: 'Timeouts', value: requestStatus.timeouts, color: 'hsl(0, 0%, 45.1%)' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Response Time (ms)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveLine
            data={[responseTimeSeries]}
            margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
            xScale={{
              type: 'time',
              format: '%Y-%m-%d',
              useUTC: false,
              precision: 'minute',
            }}
            xFormat="time:%Y-%m-%d %H:%M"
            yScale={{
              type: 'linear',
              min: 0,
              max: 120,
              stacked: false,
              reverse: false
            }}
            curve="monotoneX"
            axisBottom={{
              format: timeRange === '24h' ? '%H:%M' : '%b %d',
              tickValues: 5,
              legend: 'Time',
              legendOffset: 36,
              legendPosition: 'middle'
            }}
            axisLeft={{
              legend: 'ms',
              legendOffset: -40,
              legendPosition: 'middle'
            }}
            enablePoints={false}
            enableArea={true}
            areaOpacity={0.1}
            colors={['#3b82f6']}
            lineWidth={2}
            pointSize={6}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            useMesh={true}
            theme={{
              axis: {
                ticks: {
                  line: {
                    stroke: '#e2e8f0',
                  },
                  text: {
                    fill: '#94a3b8',
                    fontSize: 11,
                  },
                },
                legend: {
                  text: {
                    fill: '#94a3b8',
                    fontSize: 12,
                  },
                },
              },
              grid: {
                line: {
                  stroke: '#f1f5f9',
                },
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Status</CardTitle>
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
                modifiers: [
                  [
                    'darker',
                    0.2
                  ]
                ]
              }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#94a3b8"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor="#ffffff"
              colors={pieData.map(d => d.color)}
              theme={{
                tooltip: {
                  container: {
                    background: '#1e293b',
                    color: '#f8fafc',
                    fontSize: '12px',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Error Rate (%)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveLine
            data={[errorRateSeries]}
            margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
            xScale={{
              type: 'time',
              format: '%Y-%m-%d',
              useUTC: false,
            }}
            xFormat="time:%Y-%m-%d %H:%M"
            yScale={{
              type: 'linear',
              min: 0,
              max: 10,
              stacked: false,
              reverse: false
            }}
            curve="monotoneX"
            axisBottom={{
              format: timeRange === '24h' ? '%H:%M' : '%b %d',
              tickValues: 5,
              legend: 'Time',
              legendOffset: 36,
              legendPosition: 'middle'
            }}
            axisLeft={{
              legend: '%',
              legendOffset: -40,
              legendPosition: 'middle',
              tickValues: 5,
            }}
            enablePoints={false}
            enableArea={true}
            areaOpacity={0.1}
            colors={['#ef4444']}
            lineWidth={2}
            useMesh={true}
            theme={{
              axis: {
                ticks: {
                  line: {
                    stroke: '#e2e8f0',
                  },
                  text: {
                    fill: '#94a3b8',
                    fontSize: 11,
                  },
                },
                legend: {
                  text: {
                    fill: '#94a3b8',
                    fontSize: 12,
                  },
                },
              },
              grid: {
                line: {
                  stroke: '#f1f5f9',
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
