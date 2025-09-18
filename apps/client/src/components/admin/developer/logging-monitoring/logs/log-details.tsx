'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Copy } from "lucide-react";
import { LogEntry } from "../types";
import { LogLevelBadge } from "./logs-viewer";
import { format } from 'date-fns';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { toast } from "sonner";

interface LogDetailsProps {
  log?: LogEntry;
  onClose: () => void;
}

export function LogDetails({ log, onClose }: LogDetailsProps) {
  if (!log) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatJson = (obj: unknown) => {
    try {
      return JSON.stringify(obj, null, 2);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return String(obj);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <LogLevelBadge level={log.level} />
          <CardTitle className="text-lg">
            {log.message.split('\n')[0]}
          </CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-8 w-8" 
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Timestamp</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono">
                {format(log.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => copyToClipboard(log.timestamp.toISOString())}
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="sr-only">Copy timestamp</span>
              </Button>
            </div>
          </div>

          {log.source && (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Source</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono">{log.source}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(log.source)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="sr-only">Copy source</span>
                </Button>
              </div>
            </div>
          )}

          {log.context && Object.keys(log.context).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Context</h3>
              <div className="relative rounded-md overflow-hidden border">
                <div className="absolute right-2 top-2 z-10 flex space-x-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={() => copyToClipboard(formatJson(log.context))}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <SyntaxHighlighter 
                  language="json" 
                  style={atomDark}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.8rem',
                    maxHeight: '300px',
                    backgroundColor: 'hsl(var(--muted))'
                  }}
                >
                  {formatJson(log.context)}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {log.stackTrace && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Stack Trace</h3>
              <div className="relative rounded-md overflow-hidden border">
                <div className="absolute right-2 top-2 z-10 flex space-x-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={() => copyToClipboard(log.stackTrace || '')}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <SyntaxHighlighter 
                  language="text" 
                  style={atomDark}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.8rem',
                    maxHeight: '300px',
                    backgroundColor: 'hsl(var(--muted))',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {log.stackTrace}
                </SyntaxHighlighter>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
