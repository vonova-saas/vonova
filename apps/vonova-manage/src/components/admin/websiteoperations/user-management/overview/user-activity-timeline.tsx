'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, User, Settings, ShoppingCart, MessageSquare, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/functions'
import { TimelineEvent } from '../types'
import Image from 'next/image'

const eventIcons = {
  login: <User className="h-4 w-4 text-blue-500" />,
  purchase: <ShoppingCart className="h-4 w-4 text-green-500" />,
  account: <Settings className="h-4 w-4 text-purple-500" />,
  system: <Settings className="h-4 w-4 text-gray-500" />,
  message: <MessageSquare className="h-4 w-4 text-amber-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-red-500" />,
}

const eventColors = {
  login: 'bg-blue-100 text-blue-700',
  purchase: 'bg-green-100 text-green-700',
  account: 'bg-purple-100 text-purple-700',
  system: 'bg-gray-100 text-gray-700',
  message: 'bg-amber-100 text-amber-700',
  warning: 'bg-red-100 text-red-700',
}

interface UserActivityTimelineProps {
  events: TimelineEvent[]
  className?: string
}

export function UserActivityTimeline({ events, className }: UserActivityTimelineProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="relative
            before:absolute before:left-7 before:h-full before:w-0.5 before:bg-gray-200 before:dark:bg-gray-800">
            {events.map((event) => (
              <div key={event.id} className="relative mb-6 flex gap-4">
                <div className="absolute left-0 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-900 z-10">
                  <div className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full',
                    eventColors[event.type]
                  )}>
                    {eventIcons[event.type]}
                  </div>
                </div>
                <div className="ml-10 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{event.title}</h3>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>{event.timestamp}</span>
                    </div>
                  </div>
                  {event.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                  )}
                  <div className="mt-2 flex items-center">
                    {event.user.avatar ? (
                      <Image
                        src={event.user.avatar}
                        alt={event.user.name}
                        width={100}
                        height={100}
                        className="h-5 w-5 rounded-full mr-2"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium mr-2">
                        {event.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium">{event.user.name}</p>
                      <p className="text-xs text-muted-foreground">{event.user.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Mock data for the timeline
export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: '1',
    type: 'login',
    title: 'Successful login',
    description: 'Logged in from Chrome on Windows',
    timestamp: '2 minutes ago',
    user: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  {
    id: '2',
    type: 'purchase',
    title: 'New purchase',
    description: 'Order #12345 - $125.99',
    timestamp: '1 hour ago',
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com'
    }
  },
  {
    id: '3',
    type: 'account',
    title: 'Profile updated',
    description: 'Updated shipping address',
    timestamp: '3 hours ago',
    user: {
      name: 'Robert Johnson',
      email: 'robert@example.com'
    }
  },
  {
    id: '4',
    type: 'warning',
    title: 'Failed login attempt',
    description: 'Incorrect password used',
    timestamp: '5 hours ago',
    user: {
      name: 'Emily Davis',
      email: 'emily@example.com'
    }
  },
  {
    id: '5',
    type: 'message',
    title: 'New support ticket',
    description: 'Order delivery inquiry',
    timestamp: '1 day ago',
    user: {
      name: 'Michael Brown',
      email: 'michael@example.com'
    }
  },
]
