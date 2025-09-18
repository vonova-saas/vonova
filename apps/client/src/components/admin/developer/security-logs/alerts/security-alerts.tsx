'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Bell, Check, Filter, X, AlertTriangle, Info, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

type AlertStatus = 'all' | 'unread' | 'resolved' | 'critical';

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'unread' | 'in-progress' | 'resolved';
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'suspicious' | 'threat' | 'warning' | 'info';
  source: string;
  affected: string;
}

const mockAlerts: SecurityAlert[] = [
  {
    id: '1',
    title: 'Multiple Failed Login Attempts',
    description: 'Multiple failed login attempts detected for user admin from IP 192.168.1.1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'unread',
    severity: 'high',
    type: 'threat',
    source: 'Auth System',
    affected: 'User: admin'
  },
  {
    id: '2',
    title: 'Suspicious SQL Injection Attempt',
    description: 'Potential SQL injection attempt detected in search query',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'in-progress',
    severity: 'critical',
    type: 'suspicious',
    source: 'WAF',
    affected: 'API Endpoint: /api/search'
  },
  {
    id: '3',
    title: 'CORS Policy Violation',
    description: 'Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'resolved',
    severity: 'medium',
    type: 'warning',
    source: 'Browser Console',
    affected: 'Origin: https://example.com'
  },
  {
    id: '4',
    title: 'New Security Patch Available',
    description: 'A new security patch is available for your application framework',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'unread',
    severity: 'medium',
    type: 'info',
    source: 'System',
    affected: 'Package: next@latest'
  },
];

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Critical</Badge>;
    case 'high':
      return <Badge variant="destructive" className="bg-orange-500 gap-1"><AlertTriangle className="h-3 w-3" /> High</Badge>;
    case 'medium':
      return <Badge variant="secondary" className="bg-yellow-500 gap-1"><AlertTriangle className="h-3 w-3" /> Medium</Badge>;
    default:
      return <Badge variant="outline" className="gap-1"><Info className="h-3 w-3" /> Low</Badge>;
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'threat':
      return <Badge variant="destructive">Threat</Badge>;
    case 'suspicious':
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Suspicious</Badge>;
    case 'warning':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
    default:
      return <Badge variant="outline">Info</Badge>;
  }
};

export function SecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(mockAlerts);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<AlertStatus>('all');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'unread' && alert.status === 'unread') ||
      (activeTab === 'resolved' && alert.status === 'resolved') ||
      (activeTab === 'critical' && alert.severity === 'critical');

    return matchesSearch && matchesTab;
  });

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, status: 'resolved' as const } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(alert => ({
      ...alert,
      status: alert.status === 'unread' ? 'in-progress' : alert.status
    })));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as AlertStatus)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-1">
            Unread
            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center">
              {alerts.filter(a => a.status === 'unread').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAlerts.length > 0 ? (
            <div className="space-y-2">
              {filteredAlerts.map((alert) => (
                <Card key={alert.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{alert.title}</h3>
                            {getSeverityBadge(alert.severity)}
                            {getTypeBadge(alert.type)}
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Source: {alert.source}</span>
                            <span>Affected: {alert.affected}</span>
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-muted/50 border-t sm:border-t-0 sm:border-l">
                      <div className="flex gap-2">
                        {alert.status === 'unread' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => markAsRead(alert.id)}
                          >
                            <Check className="h-4 w-4" />
                            Mark as Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteAlert(alert.id)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No alerts found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? 'No alerts match your search criteria.'
                  : 'No alerts to display. All clear!'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
