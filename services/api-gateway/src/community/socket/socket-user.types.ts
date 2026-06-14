export interface SocketAuthUser {
  _id: string;
  email?: string;
  role?: string;
  name?: string;
}

export interface AuthenticatedSocket {
  user?: SocketAuthUser;
}

/** All realtime event names exchanged between gateway and client. */
export const SOCKET_EVENTS = {
  // Posts
  POST_NEW: 'post:new',
  POST_UPDATED: 'post:updated',
  POST_DELETED: 'post:deleted',
  POST_LIKED: 'post:liked',
  POST_COMMENTED: 'post:commented',
  POST_REPOSTED: 'post:reposted',
  POST_UNREPOSTED: 'post:unreposted',

  // Messaging
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_TYPING: 'message:typing',
  MESSAGE_SEEN: 'message:seen',
  CONVERSATION_NEW: 'conversation:new',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_ALL_READ: 'notification:all-read',

  // Groups
  GROUP_NEW_POST: 'group:new-post',
  GROUP_NEW_MEMBER: 'group:new-member',
  GROUP_MEMBER_LEFT: 'group:member-left',
  GROUP_CHANNEL_CREATED: 'group:channel-created',
  GROUP_POST_PINNED: 'group:post-pinned',
  GROUP_MODERATION_ACTION: 'group:moderation-action',
  GROUP_ANNOUNCEMENT: 'group:announcement',
  GROUP_TYPING: 'group:typing',
  GROUP_MESSAGE_NEW: 'group:message:new',
  GROUP_MESSAGE_UPDATED: 'group:message:updated',
  GROUP_MESSAGE_DELETED: 'group:message:deleted',
  GROUP_MESSAGE_REACTION: 'group:message:reaction',
  GROUP_CHAT_PINNED: 'group:chat:pinned',
  GROUP_CHAT_SEEN: 'group:chat:seen',
  /** A voice message dropped — surfaces a richer toast UX on receivers. */
  MESSAGE_VOICE: 'message:voice',

  // Moderation (platform + groups)
  CONTENT_REMOVED: 'moderation:content-removed',
  MESSAGE_REMOVED: 'moderation:message-removed',
  USER_MUTED: 'moderation:user-muted',
  GROUP_LOCKED: 'moderation:group-locked',
  GROUP_UNLOCKED: 'moderation:group-unlocked',
  MODERATION_REPORT_UPDATED: 'moderation:report-updated',

  // System
  SYSTEM_ONLINE: 'system:online',
  SYSTEM_OFFLINE: 'system:offline',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export function userRoom(userId: string): string {
  return `user:${userId}`;
}
export function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}
export function groupRoom(groupId: string): string {
  return `group:${groupId}`;
}
export function postRoom(postId: string): string {
  return `post:${postId}`;
}
