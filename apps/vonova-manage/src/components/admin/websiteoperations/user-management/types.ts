export type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'moderator' | 'user'
  status: 'active' | 'inactive' | 'suspended'
  lastActive: string
  joinedDate: string
  totalOrders?: number
  totalSpent?: number
}

export type UserDetailsProps = {
  user: {
    id: string
    name: string
    email: string
    role: string
    status: string
    lastActive: string
    joinedDate: string
    totalOrders?: number
    totalSpent?: number
  }
  onEdit: () => void
}

export type Activity = {
  id: string
  action: string
  type: 'user' | 'system' | 'order' | 'message'
  timestamp: string
  details?: string
  ipAddress?: string
}

export type TimelineEvent = {
  id: string
  type: 'login' | 'purchase' | 'account' | 'system' | 'message' | 'warning'
  title: string
  description?: string
  timestamp: string
  user: {
    name: string
    avatar?: string
    email: string
  }
}