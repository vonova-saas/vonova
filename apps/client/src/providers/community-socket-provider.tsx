"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { baseURL } from "@/services/base-url";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";

/** All realtime event names exchanged between gateway and client. */
export const SOCKET_EVENTS = {
  POST_NEW: "post:new",
  POST_UPDATED: "post:updated",
  POST_DELETED: "post:deleted",
  POST_LIKED: "post:liked",
  POST_COMMENTED: "post:commented",
  POST_REPOSTED: "post:reposted",
  POST_UNREPOSTED: "post:unreposted",
  MESSAGE_NEW: "message:new",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_TYPING: "message:typing",
  MESSAGE_SEEN: "message:seen",
  CONVERSATION_NEW: "conversation:new",
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_ALL_READ: "notification:all-read",
  GROUP_NEW_POST: "group:new-post",
  GROUP_NEW_MEMBER: "group:new-member",
  GROUP_MEMBER_LEFT: "group:member-left",
  GROUP_CHANNEL_CREATED: "group:channel-created",
  GROUP_POST_PINNED: "group:post-pinned",
  GROUP_MODERATION_ACTION: "group:moderation-action",
  GROUP_ANNOUNCEMENT: "group:announcement",
  GROUP_TYPING: "group:typing",
  GROUP_MESSAGE_NEW: "group:message:new",
  GROUP_MESSAGE_UPDATED: "group:message:updated",
  GROUP_MESSAGE_DELETED: "group:message:deleted",
  GROUP_MESSAGE_REACTION: "group:message:reaction",
  GROUP_CHAT_PINNED: "group:chat:pinned",
  GROUP_CHAT_SEEN: "group:chat:seen",
  MESSAGE_VOICE: "message:voice",
  CONTENT_REMOVED: "moderation:content-removed",
  MESSAGE_REMOVED: "moderation:message-removed",
  USER_MUTED: "moderation:user-muted",
  GROUP_LOCKED: "moderation:group-locked",
  GROUP_UNLOCKED: "moderation:group-unlocked",
  MODERATION_REPORT_UPDATED: "moderation:report-updated",
  SYSTEM_ONLINE: "system:online",
  SYSTEM_OFFLINE: "system:offline",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export type SocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

type Listener<T = unknown> = (payload: T) => void;

interface SocketContextValue {
  socket: Socket | null;
  status: SocketStatus;
  isConnected: boolean;
  /** Subscribe to a server event. Returns an unsubscribe function. */
  on: <T = unknown>(event: SocketEventName | string, fn: Listener<T>) => () => void;
  /** Emit (best-effort — drops silently when offline). */
  emit: <T = unknown>(event: string, payload?: T) => void;
  /** Join a conversation room (server ack). */
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  /** Join a group room. */
  joinGroup: (groupId: string) => void;
  /** Subscribe to a specific post. */
  subscribeToPost: (postId: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

function buildNamespaceUrl(): string {
  const raw = (baseURL ?? "").replace(/\/+$/, "");
  if (!raw) {
    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.host}/community`;
    }
    return "/community";
  }
  const cleaned = raw.replace(/\/api\/v\d+$/, "");
  return `${cleaned}/community`;
}

export function CommunitySocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuthContextOptional();
  const userId = auth?.user?._id;
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("idle");
  const reconnectToastShownRef = useRef<boolean>(false);

  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setStatus("idle");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ?? ""
        : "";

    const url = buildNamespaceUrl();
    const socket = io(url, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 8_000,
      timeout: 12_000,
    });
    socketRef.current = socket;
    setStatus("connecting");

    socket.on("connect", () => {
      setStatus("connected");
      if (reconnectToastShownRef.current) {
        toast.success("Back online", { duration: 1500 });
        reconnectToastShownRef.current = false;
      }
      console.info(
        `[SOCKET CONNECT] /community id=${socket.id} user=${userId}`,
      );
    });

    socket.on("disconnect", (reason) => {
      setStatus("disconnected");
      console.info(`[SOCKET DISCONNECT] /community reason=${reason}`);
      // If the server explicitly killed us (auth), don't auto-reconnect.
      if (reason === "io server disconnect") {
        socket.close();
      }
    });

    socket.io.on("reconnect_attempt", () => {
      setStatus("reconnecting");
      if (!reconnectToastShownRef.current) {
        reconnectToastShownRef.current = true;
        toast.warning("Reconnecting…", { duration: 2000 });
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("[SOCKET ERROR]", err?.message ?? err);
    });

    // Server-side auth rejection — emitted by the community gateway when the
    // JWT cookie / bearer is missing or expired.
    socket.on("auth_error", (payload: { message?: string } | undefined) => {
      console.warn("[SOCKET AUTH ERROR]", payload?.message ?? "Unauthorized");
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
    // We intentionally don't re-create the socket when the access token rotates;
    // socket.io reads it once on the next reconnect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const on = useCallback(
    <T,>(event: SocketEventName | string, fn: Listener<T>) => {
      const s = socketRef.current;
      if (!s) return () => undefined;
      s.on(event, fn as (...args: unknown[]) => void);
      return () => {
        s.off(event, fn as (...args: unknown[]) => void);
      };
    },
    [],
  );

  const emit = useCallback(<T,>(event: string, payload?: T) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit(event, payload as never);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    if (!conversationId) return;
    socketRef.current?.emit("conversation:join", { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (!conversationId) return;
    socketRef.current?.emit("conversation:leave", { conversationId });
  }, []);

  const joinGroup = useCallback((groupId: string) => {
    if (!groupId) return;
    socketRef.current?.emit("group:join", { groupId });
  }, []);

  const subscribeToPost = useCallback((postId: string) => {
    if (!postId) return;
    socketRef.current?.emit("post:subscribe", { postId });
  }, []);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket: socketRef.current,
      status,
      isConnected: status === "connected",
      on,
      emit,
      joinConversation,
      leaveConversation,
      joinGroup,
      subscribeToPost,
    }),
    [status, on, emit, joinConversation, leaveConversation, joinGroup, subscribeToPost],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useCommunitySocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error(
      "useCommunitySocket must be used inside <CommunitySocketProvider>",
    );
  }
  return ctx;
}

export function useCommunitySocketOptional(): SocketContextValue | null {
  return useContext(SocketContext);
}

/**
 * Subscribe to a socket event for the lifetime of the calling component.
 * Re-subscribes automatically when the socket reconnects.
 */
export function useSocketEvent<T = unknown>(
  event: SocketEventName | string,
  handler: Listener<T>,
  deps: ReadonlyArray<unknown> = [],
) {
  const ctx = useCommunitySocketOptional();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stable = useCallback(handler, deps);
  useEffect(() => {
    if (!ctx?.socket) return;
    const off = ctx.on<T>(event, stable);
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.socket, ctx?.status, event, stable]);
}
