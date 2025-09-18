export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  action?: () => void;
  actionLabel?: string;
  avatar?: string;
  user?: string;
}