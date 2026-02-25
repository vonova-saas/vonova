import { ReactNode } from 'react';

export type SupportCategory = 'technical' | 'billing' | 'general' | 'feature-request' | 'bug-report';
export type SupportStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  category: SupportCategory;
  subject: string;
  message: string;
  status: SupportStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  responses?: SupportTicketResponse[];
}

export interface SupportTicketResponse {
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'user';
  message: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

export interface StatusBadgeProps {
  status: SupportStatus;
  className?: string;
  children?: ReactNode;
}

export interface CategoryIconProps {
  category: SupportCategory;
  className?: string;
}
