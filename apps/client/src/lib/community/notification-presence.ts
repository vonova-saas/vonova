/** Client-side view context to suppress noisy notification toasts/badges. */

export type CommunityPresenceView =
  | { kind: "conversation"; id: string }
  | { kind: "group"; id: string }
  | { kind: "post"; id: string }
  | null;

let activeView: CommunityPresenceView = null;

export function setCommunityPresenceView(view: CommunityPresenceView) {
  activeView = view;
}

export function getCommunityPresenceView(): CommunityPresenceView {
  return activeView;
}

export function shouldSuppressNotification(input: {
  type?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}): boolean {
  if (!activeView) return false;
  const t = String(input.type ?? "").toUpperCase();
  if (t === "MESSAGE" && activeView.kind === "conversation") {
    const cid =
      input.meta?.conversationId != null
        ? String(input.meta.conversationId)
        : input.entityId != null
          ? String(input.entityId)
          : "";
    return cid === activeView.id;
  }
  if (t === "MENTION" && input.meta?.forceMention) {
    return false;
  }
  if (t === "GROUP_CHAT" && activeView.kind === "group") {
    const gid =
      input.meta?.groupId != null
        ? String(input.meta.groupId)
        : input.entityId != null
          ? String(input.entityId)
          : "";
    return gid === activeView.id;
  }
  if (
    ["LIKE", "COMMENT", "REPLY", "REPOST", "MENTION"].includes(t) &&
    activeView.kind === "post"
  ) {
    return String(input.entityId ?? "") === activeView.id;
  }
  return false;
}
