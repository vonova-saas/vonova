/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface LogEntry {
  _id: string;
  ip: string;
  userAgent: string;
  method: string;
  route: string;
  attackType: string;
  details: {
    origin?: string;
    query?: Record<string, any>;
    body?: any;
    responseBody?: any;
  };
  timestamp: string;
  statusCode: number;
  responseTime: number;
}

interface SecurityLogsTableProps {
  timeRange?: { from: Date; to: Date };
  refreshCount?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SecurityLogsTable({ timeRange, refreshCount }: SecurityLogsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API call
  const logs: LogEntry[] = [
    {
      _id: '1',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      method: 'POST',
      route: '/api/auth/login',
      attackType: 'Brute Force',
      details: {
        origin: 'https://example.com',
        query: { redirect: '/dashboard' },
        body: { email: 'test@example.com', password: 'password123' },
        responseBody: { error: 'Invalid credentials' }
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      statusCode: 401,
      responseTime: 45
    },
    {
      _id: '2',
      ip: '10.0.0.1',
      userAgent: 'curl/7.68.0',
      method: 'GET',
      route: '/api/users/1',
      attackType: 'SQL Injection',
      details: {
        query: { id: "1' OR '1'='1" },
        responseBody: { error: 'Database error' }
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      statusCode: 500,
      responseTime: 23
    },
    {
      _id: '3',
      ip: '172.16.0.1',
      userAgent: 'Mozilla/5.0',
      method: 'GET',
      route: '/admin',
      attackType: 'Unauthorized Access',
      details: {
        origin: 'https://malicious-site.com',
        responseBody: { error: 'Access denied' }
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      statusCode: 403,
      responseTime: 8
    }
  ];

  const toggleRow = (logId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(logId)) {
      newExpandedRows.delete(logId);
    } else {
      newExpandedRows.add(logId);
    }
    setExpandedRows(newExpandedRows);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800';
    if (status >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getAttackTypeColor = (type: string) => {
    switch (type) {
      case 'SQL Injection':
        return 'bg-red-100 text-red-800';
      case 'XSS Attempt':
        return 'bg-purple-100 text-purple-800';
      case 'Brute Force':
        return 'bg-orange-100 text-orange-800';
      case 'Unauthorized Access':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.ip.toLowerCase().includes(search) ||
      log.method.toLowerCase().includes(search) ||
      log.route.toLowerCase().includes(search) ||
      log.attackType.toLowerCase().includes(search) ||
      log.statusCode.toString().includes(search)
    );
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Security Logs</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search logs..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Response Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <React.Fragment key={log._id}>
                <TableRow>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{format(new Date(log.timestamp), 'MMM d, yyyy')}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'h:mm a')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.method}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{log.route}</TableCell>
                  <TableCell>
                    <Badge className={getAttackTypeColor(log.attackType)}>
                      {log.attackType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(log.statusCode)}>
                      {log.statusCode}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.responseTime}ms</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(log._id)}
                      className="flex items-center gap-1"
                    >
                      {expandedRows.has(log._id) ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          View
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRows.has(log._id) && (
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={8} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Request Details</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Method:</span> {log.method || 'N/A'}</p>
                              <p><span className="text-muted-foreground">URL:</span> {log.route || 'N/A'}</p>
                              <p><span className="text-muted-foreground">IP:</span> {log.ip || 'N/A'}</p>
                              <p><span className="text-muted-foreground">User Agent:</span> {log.userAgent || 'N/A'}</p>
                              {log.details?.origin && (
                                <p><span className="text-muted-foreground">Origin:</span> {log.details.origin}</p>
                              )}
                            </div>
                          </div>
                          
                          {log.details?.query && (
                            <div>
                              <h5 className="font-medium mb-2">Query Parameters</h5>
                              <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                                {JSON.stringify(log.details.query, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Response</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Status:</span> {log.statusCode || 'N/A'}</p>
                              <p><span className="text-muted-foreground">Response Time:</span> {log.responseTime ? `${log.responseTime}ms` : 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {log.details?.body && (
                              <div>
                                <h5 className="font-medium">Request Body</h5>
                                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                                  {typeof log.details.body === 'string' 
                                    ? log.details.body 
                                    : JSON.stringify(log.details.body, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {log.details?.responseBody && (
                              <div>
                                <h5 className="font-medium">Response Body</h5>
                                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                                  {typeof log.details.responseBody === 'string'
                                    ? log.details.responseBody
                                    : JSON.stringify(log.details.responseBody, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No security logs found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
