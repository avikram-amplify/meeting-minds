import type { ActiveChat, DialogSummary, Message, NotificationSummary, RoomListItem, User } from "../types";

export const EMPTY_SUMMARY: NotificationSummary = {
  rooms: [],
  dialogs: [],
  incoming_friend_requests: 0,
};

export const HEARTBEAT_MS = 30_000;

export function chooseInitialChat(
  joinedRooms: RoomListItem[],
  dialogs: DialogSummary[],
): ActiveChat | null {
  const unreadRoom = joinedRooms.find((room) => (room.unread_count ?? 0) > 0);
  if (unreadRoom) return { kind: "room", id: unreadRoom.id };
  const unreadDialog = dialogs.find((dialog) => dialog.unread_count > 0);
  if (unreadDialog) return { kind: "dialog", id: unreadDialog.id };
  if (joinedRooms[0]) return { kind: "room", id: joinedRooms[0].id };
  if (dialogs[0]) return { kind: "dialog", id: dialogs[0].id };
  return null;
}

export function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRelative(value: string): string {
  const date = new Date(value);
  const delta = Math.round((Date.now() - date.getTime()) / 60_000);
  if (delta < 1) return "now";
  if (delta < 60) return `${delta}m`;
  if (delta < 1_440) return `${Math.round(delta / 60)}h`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export function compactCount(value: number): string {
  return value <= 99 ? String(value) : "99+";
}

export function upsertMessage(list: Message[], message: Message): Message[] {
  const idx = list.findIndex((item) => item.id === message.id);
  if (idx >= 0) {
    const next = list.slice();
    next[idx] = message;
    return next.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  return [...list, message].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function upsertDialog(list: DialogSummary[], dialog: DialogSummary): DialogSummary[] {
  return [dialog, ...list.filter((item) => item.id !== dialog.id)];
}

export function removeMessage(list: Message[], messageId: string): Message[] {
  return list.filter((item) => item.id !== messageId);
}

export function patchPresenceInUser(
  user: User,
  targetUserId: string,
  presence: User["presence"],
): User {
  if (user.id !== targetUserId) return user;
  return { ...user, presence };
}

export function updateUnreadCountsFromSummary(
  joinedRooms: RoomListItem[],
  dialogs: DialogSummary[],
  summary: NotificationSummary,
): { joinedRooms: RoomListItem[]; dialogs: DialogSummary[] } {
  const roomCounts = new Map(summary.rooms.map((r) => [r.room_id, r.unread_count]));
  const dialogCounts = new Map(summary.dialogs.map((d) => [d.dialog_id, d.unread_count]));
  return {
    joinedRooms: joinedRooms.map((room) => ({
      ...room,
      unread_count: roomCounts.get(room.id) ?? 0,
    })),
    dialogs: dialogs.map((dialog) => ({
      ...dialog,
      unread_count: dialogCounts.get(dialog.id) ?? 0,
    })),
  };
}

export function isChatEqual(
  left: ActiveChat | null,
  right: ActiveChat | null,
): boolean {
  if (!left || !right) return left === right;
  return left.kind === right.kind && left.id === right.id;
}
