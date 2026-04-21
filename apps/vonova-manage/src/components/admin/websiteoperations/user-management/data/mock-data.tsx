import { Activity } from "../types"

export const mockActivities: Activity[] = [
  {
    id: '1',
    action: 'User logged in',
    type: 'user',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    ipAddress: '192.168.1.1'
  },
  {
    id: '2',
    action: 'Password changed',
    type: 'system',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    details: 'Password was updated'
  },
  {
    id: '3',
    action: 'Order #12345 placed',
    type: 'order',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    details: 'Total: $125.99',
    ipAddress: '192.168.1.1'
  },
  {
    id: '4',
    action: 'Profile updated',
    type: 'user',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    details: 'Updated shipping address',
    ipAddress: '192.168.1.1'
  },
]