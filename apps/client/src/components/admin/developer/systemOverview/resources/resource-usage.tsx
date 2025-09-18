import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HardDrive, Cpu, MemoryStick } from "lucide-react";

interface ResourceItemProps {
  name: string;
  value: number;
  total: number;
  unit: string;
  icon: React.ReactNode;
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function ResourceItem({ name, value, total, unit, icon }: ResourceItemProps) {
  const percentage = Math.round((value / total) * 100);
  
  const getProgressColor = (percent: number) => {
    if (percent < 70) return 'bg-green-500';
    if (percent < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const displayValue = unit === 'bytes' ? formatBytes(value) : `${value}%`;
  const displayTotal = unit === 'bytes' ? formatBytes(total) : `${total}%`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="rounded-lg bg-muted p-1">
            {icon}
          </div>
          <span className="text-sm font-medium">{name}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {displayValue} / {displayTotal}
        </span>
      </div>
      <Progress value={percentage} className={`h-2 ${getProgressColor(percentage)}`} />
    </div>
  );
}

export function ResourceUsage() {
  // In a real app, these values would come from an API
  const resources = [
    {
      id: 'cpu',
      name: 'CPU',
      value: 24,
      total: 100,
      unit: 'percent',
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      id: 'memory',
      name: 'Memory',
      value: 7.2 * 1024 * 1024 * 1024, // 7.2 GB
      total: 16 * 1024 * 1024 * 1024, // 16 GB
      unit: 'bytes',
      icon: <MemoryStick className="h-4 w-4" />,
    },
    {
      id: 'disk',
      name: 'Disk',
      value: 120 * 1024 * 1024 * 1024, // 120 GB
      total: 256 * 1024 * 1024 * 1024, // 256 GB
      unit: 'bytes',
      icon: <HardDrive className="h-4 w-4" />,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Resource Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {resources.map((resource) => (
          <ResourceItem
            key={resource.id}
            name={resource.name}
            value={resource.value}
            total={resource.total}
            unit={resource.unit as 'bytes' | 'percent'}
            icon={resource.icon}
          />
        ))}
      </CardContent>
    </Card>
  );
}
