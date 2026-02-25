'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ResourceUsageProps {
  name: string;
  usage: number;
  total: string;
  color: string;
}

const ResourceUsage = ({ name, usage, total, color }: ResourceUsageProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{name}</span>
      <span className="text-sm text-muted-foreground">{usage}% of {total}</span>
    </div>
    <Progress value={usage} className={`h-2 [&>div]:bg-${color}-500`} />
  </div>
);

export function SystemResources() {
  const resources = [
    { name: 'CPU', usage: 45, total: '16 Cores', color: 'blue' },
    { name: 'Memory', usage: 68, total: '32GB', color: 'green' },
    { name: 'Disk', usage: 32, total: '1TB', color: 'purple' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {resources.map((resource) => (
          <ResourceUsage key={resource.name} {...resource} />
        ))}
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
