import { LogEntry, LogSource } from '../types';

export const generateMockLogs = (count: number): LogEntry[] => {
  const levels: LogEntry['level'][] = ['error', 'warning', 'info', 'debug', 'trace'];
  const sources = ['api', 'database', 'auth', 'frontend', 'worker'];
  const messages = [
    'User authentication failed',
    'Database connection established',
    'Request processed successfully',
    'Cache miss for key',
    'Performance metrics collected',
    'New user registered',
    'Payment processed',
    'Email sent successfully',
    'File uploaded',
    'Background job completed'
  ];

  return Array.from({ length: count }, (_, i) => {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const message = `${messages[Math.floor(Math.random() * messages.length)]} #${Math.floor(Math.random() * 1000)}`;

    return {
      id: `log-${i}`,
      timestamp,
      level,
      message,
      source,
      context: Math.random() > 0.7 ? {
        userId: `user-${Math.floor(Math.random() * 1000)}`,
        requestId: `req-${Math.random().toString(36).substring(2, 10)}`,
        duration: `${Math.floor(Math.random() * 500)}ms`,
        ...(Math.random() > 0.5 && { ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` })
      } : undefined,
      stackTrace: level === 'error' && Math.random() > 0.5 ?
        `Error: Something went wrong\n    at Function.<anonymous> (/app/src/services/${source}.js:${Math.floor(Math.random() * 200) + 1}:${Math.floor(Math.random() * 50) + 1})\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)`
        : undefined
    };
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const mockSources: LogSource[] = [
  { id: 'api', name: 'API Server', type: 'application', logCount: 1245, lastUpdated: new Date() },
  { id: 'database', name: 'Database', type: 'database', logCount: 843, lastUpdated: new Date() },
  { id: 'auth', name: 'Auth Service', type: 'service', logCount: 321, lastUpdated: new Date() },
  { id: 'frontend', name: 'Frontend', type: 'application', logCount: 567, lastUpdated: new Date() },
  { id: 'worker', name: 'Worker', type: 'service', logCount: 289, lastUpdated: new Date() },
];
