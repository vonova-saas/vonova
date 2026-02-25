'use client'

import { ResponsiveBar } from '@nivo/bar'
import { ResponsivePie } from '@nivo/pie'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'

type UserStatisticsProps = {
  userActivity: Array<{
    date: string
    active: number
    newUsers: number
  }>
  roleDistribution: Array<{
    id: string
    label: string
    value: number
    color: string
  }>
}

export function UserStatistics({ userActivity, roleDistribution }: UserStatisticsProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>User Activity (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveBar
            data={userActivity}
            keys={['active', 'newUsers']}
            indexBy="date"
            margin={{ top: 20, right: 30, bottom: 80, left: 50 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={['#3b82f6', '#10b981']}
            theme={{
              text: {
                fill: isDark ? '#e2e8f0' : '#1e293b',
                fontSize: 11,
              },
              grid: {
                line: {
                  stroke: isDark ? '#334155' : '#e2e8f0',
                  strokeWidth: 1,
                },
              },
              axis: {
                domain: {
                  line: {
                    stroke: isDark ? '#475569' : '#cbd5e1',
                    strokeWidth: 1,
                  },
                },
                ticks: {
                  line: {
                    stroke: isDark ? '#475569' : '#cbd5e1',
                    strokeWidth: 1,
                  },
                },
              },
            }}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legendPosition: 'middle',
              legendOffset: 60,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Users',
              legendPosition: 'middle',
              legendOffset: -40,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateY: 70,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 12,
              },
            ]}
            animate={true}
            motionConfig="gentle"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Roles Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsivePie
            data={roleDistribution}
            margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor={isDark ? '#e2e8f0' : '#1e293b'}
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={isDark ? '#94a3b8' : '#cbd5e1'}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor="white"
            theme={{
              text: {
                fill: isDark ? '#e2e8f0' : '#1e293b',
                fontSize: 11,
              },
              tooltip: {
                container: {
                  background: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                },
              },
            }}
            defs={[
              {
                id: 'dots',
                type: 'patternDots',
                background: 'inherit',
                color: 'rgba(255, 255, 255, 0.3)',
                size: 4,
                padding: 1,
                stagger: true,
              },
              {
                id: 'lines',
                type: 'patternLines',
                background: 'inherit',
                color: 'rgba(255, 255, 255, 0.3)',
                rotation: -45,
                lineWidth: 6,
                spacing: 10,
              },
            ]}
            fill={[
              {
                match: {
                  id: 'admin',
                },
                id: 'dots',
              },
              {
                match: {
                  id: 'moderator',
                },
                id: 'lines',
              },
            ]}
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
                itemTextColor: isDark ? '#e2e8f0' : '#1e293b',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: 'circle',
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
