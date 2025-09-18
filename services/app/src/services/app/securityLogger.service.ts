import SecurityLog from '../../models/app/securityLog.model';

export async function logSecurityEvent(event: {
  ip: string;
  userAgent?: string;
  method: string;
  route: string;
  attackType: string;
  details?: any;
}) {
  // Log to terminal
  console.warn(`[SECURITY] Attack detected:`, {
    ...event,
    timestamp: new Date().toISOString()
  });

  // Save to database
  try {
    await SecurityLog.create({
      ...event,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[SECURITY] Failed to save security log:', err);
  }
} 