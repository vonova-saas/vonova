import { CheckCircle2, AlertCircle, Clock, Server, Database, Cpu, Cloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusItemProps } from "../types";

function StatusItem({ name, status, icon }: StatusItemProps) {
  const statusConfig = {
    operational: {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      text: 'Operational',
      color: 'text-green-500',
    },
    degraded: {
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
      text: 'Degraded',
      color: 'text-yellow-500',
    },
    outage: {
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      text: 'Outage',
      color: 'text-red-500',
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <div className="rounded-lg bg-muted p-2">
          {icon}
        </div>
        <span className="font-medium">{name}</span>
      </div>
      <div className={`flex items-center space-x-2 ${currentStatus.color}`}>
        {currentStatus.icon}
        <span className="text-sm">{currentStatus.text}</span>
      </div>
    </div>
  );
}

export function SystemStatus() {
  // In a real app, this would come from an API
  const services = [
    { id: 'api', name: 'API Server', status: 'operational' as const, icon: <Server className="h-4 w-4" /> },
    { id: 'database', name: 'Database', status: 'operational' as const, icon: <Database className="h-4 w-4" /> },
    { id: 'auth', name: 'Authentication', status: 'operational' as const, icon: <CheckCircle2 className="h-4 w-4" /> },
    { id: 'storage', name: 'File Storage', status: 'degraded' as const, icon: <Cloud className="h-4 w-4" /> },
    { id: 'workers', name: 'Background Workers', status: 'operational' as const, icon: <Cpu className="h-4 w-4" /> },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <StatusItem
              key={service.id}
              name={service.name}
              status={service.status}
              icon={service.icon}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
