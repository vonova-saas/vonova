import { User, Activity } from "../types"

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    lastActive: '2 minutes ago',
    joinedDate: 'Jan 15, 2023',
    totalOrders: 24,
    totalSpent: 1250.75
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'moderator',
    status: 'active',
    lastActive: '1 hour ago',
    joinedDate: 'Feb 3, 2023',
    totalOrders: 12,
    totalSpent: 845.50
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert@example.com',
    role: 'user',
    status: 'inactive',
    lastActive: '3 days ago',
    joinedDate: 'Mar 10, 2023',
    totalOrders: 5,
    totalSpent: 320.00
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@example.com',
    role: 'user',
    status: 'suspended',
    lastActive: '2 weeks ago',
    joinedDate: 'Apr 5, 2023',
    totalOrders: 0,
    totalSpent: 0
  },
]

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