import { useState, useEffect, useCallback, useRef } from 'react';
import { LogEntry, LogSource, TimeRange } from '@/components/admin/developer/logging-monitoring/types';
import { generateMockLogs, mockSources } from '@/components/admin/developer/logging-monitoring/data/mock-data';

export const useLoggingSystem = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sources] = useState<LogSource[]>(mockSources);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const ws = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // In a real app, this would be your WebSocket server URL
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          // Initial data load
          setLogs(generateMockLogs(50));
        };

        ws.current.onmessage = (event) => {
          try {
            const newLog = JSON.parse(event.data);
            setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 1000)); // Keep last 1000 logs
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError(new Error('WebSocket connection error'));
        };

        ws.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          // Attempt to reconnect after a delay
          setTimeout(connectWebSocket, 5000);
        };
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        setError(err instanceof Error ? err : new Error('Failed to connect to WebSocket'));
      }
    };

    connectWebSocket();

    // Clean up WebSocket connection on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  // Function to manually add a log (for testing)
  const addLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date(),
    };
    
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(newLog));
    } else {
      setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 1000));
    }
  }, []);

  // Function to clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Function to refresh logs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const refreshLogs = useCallback((timeRange: TimeRange) => {
    // In a real app, this would fetch logs based on the time range
    setLogs(generateMockLogs(50));
  }, []);

  return {
    logs,
    sources,
    isConnected,
    error,
    addLog,
    clearLogs,
    refreshLogs,
  };
};
