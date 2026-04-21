import type { ChangeEvent, FormEvent } from "react";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import {
  acceptFriendRequest,
  acceptRoomInvitation,
  ApiError,
  banRoomUser,
  createPeerBan,
  createRoom,
  deleteAttachment,
  deleteMessage,
  deleteRoom,
  demoteRoomAdmin,
  editMessage,
  ensureDialog,
  fetchCurrentUser,
  fetchDialogs,
  fetchFriends,
  fetchIncomingRequests,
  fetchJoinedRooms,
  fetchMessages,
  fetchNotificationSummary,
  fetchOutgoingRequests,
  fetchPeerBans,
  fetchPublicRooms,
  fetchRoomBans,
  fetchRoomDetail,
  fetchRoomInvitations,
  fetchRoomMembers,
  fetchSessionStatus,
  fetchSessions,
  inviteUserToRoom,
  joinRoom,
  leaveRoom,
  login,
  logout,
  markChatRead,
  promoteRoomAdmin,
  register,
  rejectFriendRequest,
  rejectRoomInvitation,
  removeFriend,
  removePeerBan,
  removeRoomMember,
  requestPasswordReset,
  revokeSession,
  sendFriendRequest,
  sendMessage,
  unbanRoomUser,
  updateRoom,
  uploadAttachment,
} from "./lib/api";
import { applyFriendRequestUpdate } from "./lib/friendRequestEvents";
import type {
  ActiveChat,
  DialogSummary,
  FriendItem,
  IncomingFriendRequest,
  Message,
  NotificationSummary,
  OutgoingFriendRequest,
  PeerBan,
  RoomBan,
  RoomDetail,
  RoomInvitation,
  RoomListItem,
  RoomMember,
  SessionRecord,
  User,
} from "./types";
import type {
  AuthMode,
  ConnectionState,
  QueuedAttachment,
  ShellStatus,
  SidebarTab,
  ToastState,
} from "./types/app";
import { AuthShell } from "./components/auth/AuthShell";
import { Sidebar } from "./components/sidebar/Sidebar";
import { ConversationPanel } from "./components/chat/ConversationPanel";
import { ContextPanel } from "./components/context/ContextPanel";
import { CreateRoomModal } from "./components/modals/CreateRoomModal";
import { PeopleModal } from "./components/modals/PeopleModal";
import { SessionsModal } from "./components/modals/SessionsModal";
import { Toast } from "./components/Toast";

declare const __WS_BASE_URL__: string;

const EMPTY_SUMMARY: NotificationSummary = {
  rooms: [],
  dialogs: [],
  incoming_friend_requests: 0,
};

const HEARTBEAT_MS = 30_000;

function getWebSocketUrl(): string {
  if (__WS_BASE_URL__.startsWith("ws://") || __WS_BASE_URL__.startsWith("wss://")) {
    return __WS_BASE_URL__;
  }
  if (__WS_BASE_URL__.startsWith("http://")) {
    return __WS_BASE_URL__.replace("http://", "ws://");
  }
  if (__WS_BASE_URL__.startsWith("https://")) {
    return __WS_BASE_URL__.replace("https://", "wss://");
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  if (__WS_BASE_URL__.startsWith("/")) {
    return `${protocol}//${window.location.host}${__WS_BASE_URL__}`;
  }
  return `${protocol}//${window.location.host}/${__WS_BASE_URL__}`;
}

function chooseInitialChat(joinedRooms: RoomListItem[], dialogs: DialogSummary[]): ActiveChat | null {
  const unreadRoom = joinedRooms.find((room) => (room.unread_count ?? 0) > 0);
  if (unreadRoom) return { kind: "room", id: unreadRoom.id };
  const unreadDialog = dialogs.find((dialog) => dialog.unread_count > 0);
  if (unreadDialog) return { kind: "dialog", id: unreadDialog.id };
  if (joinedRooms[0]) return { kind: "room", id: joinedRooms[0].id };
  if (dialogs[0]) return { kind: "dialog", id: dialogs[0].id };
  return null;
}

function upsertMessage(list: Message[], message: Message): Message[] {
  const existingIndex = list.findIndex((item) => item.id === message.id);
  if (existingIndex >= 0) {
    const next = list.slice();
    next[existingIndex] = message;
    return next.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  return [...list, message].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function upsertDialog(list: DialogSummary[], dialog: DialogSummary): DialogSummary[] {
  return [dialog, ...list.filter((item) => item.id !== dialog.id)];
}

function removeMessage(list: Message[], messageId: string): Message[] {
  return list.filter((item) => item.id !== messageId);
}

function patchPresenceInUser(user: User, targetUserId: string, presence: User["presence"]): User {
  if (user.id !== targetUserId) return user;
  return { ...user, presence };
}

function updateUnreadCountsFromSummary(
  joinedRooms: RoomListItem[],
  dialogs: DialogSummary[],
  summary: NotificationSummary,
): { joinedRooms: RoomListItem[]; dialogs: DialogSummary[] } {
  const roomCounts = new Map(summary.rooms.map((r) => [r.room_id, r.unread_count]));
  const dialogCounts = new Map(summary.dialogs.map((d) => [d.dialog_id, d.unread_count]));
  return {
    joinedRooms: joinedRooms.map((r) => ({ ...r, unread_count: roomCounts.get(r.id) ?? 0 })),
    dialogs: dialogs.map((d) => ({ ...d, unread_count: dialogCounts.get(d.id) ?? 0 })),
  };
}

function isChatEqual(left: ActiveChat | null, right: ActiveChat | null): boolean {
  if (!left || !right) return left === right;
  return left.kind === right.kind && left.id === right.id;
}

export default function App() {
  const [shellStatus, setShellStatus] = useState<ShellStatus>("booting");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [profile, setProfile] = useState<User | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [busy, setBusy] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  const [joinedRooms, setJoinedRooms] = useState<RoomListItem[]>([]);
  const [publicRooms, setPublicRooms] = useState<RoomListItem[]>([]);
  const [dialogs, setDialogs] = useState<DialogSummary[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingFriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingFriendRequest[]>([]);
  const [peerBans, setPeerBans] = useState<PeerBan[]>([]);
  const [notificationSummary, setNotificationSummary] = useState<NotificationSummary>(EMPTY_SUMMARY);
  const [pendingInvitations, setPendingInvitations] = useState<RoomInvitation[]>([]);

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("rooms");
  const [publicSearch, setPublicSearch] = useState("");
  const deferredPublicSearch = useDeferredValue(publicSearch);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);

  const [activeRoom, setActiveRoom] = useState<RoomDetail | null>(null);
  const [activeRoomMembers, setActiveRoomMembers] = useState<RoomMember[]>([]);
  const [activeRoomBans, setActiveRoomBans] = useState<RoomBan[]>([]);
  const [activeRoomInvitations, setActiveRoomInvitations] = useState<RoomInvitation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageCursor, setMessageCursor] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [queuedAttachments, setQueuedAttachments] = useState<QueuedAttachment[]>([]);
  const [attachmentComment, setAttachmentComment] = useState("");

  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomVisibility, setNewRoomVisibility] = useState<RoomDetail["visibility"]>("public");

  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [friendRequestUsername, setFriendRequestUsername] = useState("");
  const [friendRequestMessage, setFriendRequestMessage] = useState("");

  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [inviteUsername, setInviteUsername] = useState("");
  const [roomEditName, setRoomEditName] = useState("");
  const [roomEditDescription, setRoomEditDescription] = useState("");
  const [roomEditVisibility, setRoomEditVisibility] = useState<RoomDetail["visibility"]>("public");
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  const wsRef = useRef<WebSocket | null>(null);
  const activeChatRef = useRef<ActiveChat | null>(null);
  const profileRef = useRef<User | null>(null);
  const friendsRef = useRef<FriendItem[]>([]);
  const incomingRequestsRef = useRef<IncomingFriendRequest[]>([]);
  const outgoingRequestsRef = useRef<OutgoingFriendRequest[]>([]);
  const notificationSummaryRef = useRef<NotificationSummary>(EMPTY_SUMMARY);
  const tabIdRef = useRef(`tab-${crypto.randomUUID()}`);
  const subscribedChatRef = useRef<ActiveChat | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const restoreScrollRef = useRef<number | null>(null);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { friendsRef.current = friends; }, [friends]);
  useEffect(() => { incomingRequestsRef.current = incomingRequests; }, [incomingRequests]);
  useEffect(() => { outgoingRequestsRef.current = outgoingRequests; }, [outgoingRequests]);
  useEffect(() => { notificationSummaryRef.current = notificationSummary; }, [notificationSummary]);

  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      subscribedChatRef.current = activeChat;
      return;
    }
    const previous = subscribedChatRef.current;
    if (previous && !isChatEqual(previous, activeChat)) unsubscribeFromChat(previous);
    if (activeChat && !isChatEqual(previous, activeChat)) subscribeToChat(activeChat);
    subscribedChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 4_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const isAuthenticated = await fetchSessionStatus();
        if (cancelled) return;
        if (!isAuthenticated) { setShellStatus("guest"); return; }
        const user = await fetchCurrentUser();
        if (cancelled) return;
        if (!user) { setShellStatus("guest"); return; }
        setProfile(user);
        await refreshShell(user, true);
      } catch (error) {
        if (!cancelled) { setShellStatus("guest"); pushError(error); }
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (shellStatus !== "ready") return undefined;
    let cancelled = false;
    startTransition(() => {
      fetchPublicRooms(deferredPublicSearch)
        .then((rooms) => { if (!cancelled) setPublicRooms(rooms); })
        .catch((error) => { if (!cancelled) pushError(error); });
    });
    return () => { cancelled = true; };
  }, [deferredPublicSearch, shellStatus]);

  useEffect(() => {
    if (shellStatus !== "ready" || !profile) return undefined;
    const socket = new WebSocket(getWebSocketUrl());
    wsRef.current = socket;
    setConnectionState("connecting");

    socket.onopen = () => {
      setConnectionState("open");
      sendPresenceHeartbeat(true);
      if (activeChatRef.current) {
        subscribeToChat(activeChatRef.current);
        subscribedChatRef.current = activeChatRef.current;
      }
    };
    socket.onclose = () => { setConnectionState("closed"); wsRef.current = null; };
    socket.onerror = () => { setConnectionState("closed"); };
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { type: string; payload: Record<string, unknown> };
      handleSocketEvent(payload.type, payload.payload);
    };

    const heartbeat = window.setInterval(() => sendPresenceHeartbeat(!document.hidden), HEARTBEAT_MS);
    const updatePresence = () => sendPresenceHeartbeat(!document.hidden);
    window.addEventListener("focus", updatePresence);
    document.addEventListener("visibilitychange", updatePresence);
    document.addEventListener("keydown", updatePresence);
    document.addEventListener("pointerdown", updatePresence);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("focus", updatePresence);
      document.removeEventListener("visibilitychange", updatePresence);
      document.removeEventListener("keydown", updatePresence);
      document.removeEventListener("pointerdown", updatePresence);
      socket.close();
    };
  }, [profile, shellStatus]);

  useEffect(() => {
    if (shellStatus !== "ready" || !activeChat) {
      setMessages([]);
      setMessageCursor(null);
      setActiveRoom(null);
      setActiveRoomMembers([]);
      setActiveRoomBans([]);
      setActiveRoomInvitations([]);
      return;
    }

    let cancelled = false;
    const currentChat = activeChat;
    setMessagesLoading(true);
    setReplyTarget(null);
    setEditingMessageId(null);
    setEditingText("");

    async function loadChat() {
      try {
        const [{ messages: nextMessages, pagination }, roomDetail, roomMembers, roomBans, roomInvitations] =
          await Promise.all([
            fetchMessages(currentChat),
            currentChat.kind === "room" ? fetchRoomDetail(currentChat.id) : Promise.resolve(null),
            currentChat.kind === "room" ? fetchRoomMembers(currentChat.id) : Promise.resolve([]),
            currentChat.kind === "room" ? fetchRoomBans(currentChat.id).catch(() => []) : Promise.resolve([]),
            currentChat.kind === "room" ? fetchRoomInvitations(currentChat.id).catch(() => []) : Promise.resolve([]),
          ]);

        if (cancelled) return;

        setMessages(nextMessages);
        setMessageCursor(pagination.next_cursor);
        setActiveRoom(roomDetail);
        setActiveRoomMembers(roomMembers);
        setActiveRoomBans(roomBans);
        setActiveRoomInvitations(roomInvitations);

        if (roomDetail) {
          setRoomEditName(roomDetail.name);
          setRoomEditDescription(roomDetail.description ?? "");
          setRoomEditVisibility(roomDetail.visibility);
        }

        queueScrollToBottom();
        await markCurrentChatRead(currentChat);
      } catch (error) {
        if (!cancelled) pushError(error);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }

    loadChat();
    return () => { cancelled = true; };
  }, [activeChat, shellStatus]);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    if (restoreScrollRef.current !== null) {
      const previousHeight = restoreScrollRef.current;
      restoreScrollRef.current = null;
      viewport.scrollTop = viewport.scrollHeight - previousHeight;
      return;
    }
    if (stickToBottomRef.current) viewport.scrollTop = viewport.scrollHeight;
  }, [messages]);

  async function refreshShell(user: User, preserveSelection: boolean) {
    const [
      nextJoinedRooms, nextPublicRooms, nextDialogs, nextFriends,
      nextIncomingRequests, nextOutgoingRequests, nextPeerBans, nextSummary,
    ] = await Promise.all([
      fetchJoinedRooms(), fetchPublicRooms(deferredPublicSearch), fetchDialogs(),
      fetchFriends(), fetchIncomingRequests(), fetchOutgoingRequests(),
      fetchPeerBans(), fetchNotificationSummary(),
    ]);

    const synced = updateUnreadCountsFromSummary(nextJoinedRooms, nextDialogs, nextSummary);
    setJoinedRooms(synced.joinedRooms);
    setPublicRooms(nextPublicRooms);
    setDialogs(synced.dialogs);
    setFriends(nextFriends);
    setIncomingRequests(nextIncomingRequests);
    setOutgoingRequests(nextOutgoingRequests);
    setPeerBans(nextPeerBans);
    setNotificationSummary(nextSummary);
    setShellStatus("ready");

    if (!preserveSelection || !activeChatRef.current) {
      startTransition(() => setActiveChat(chooseInitialChat(synced.joinedRooms, synced.dialogs)));
    } else {
      const selection = activeChatRef.current;
      const stillExists =
        selection.kind === "room"
          ? synced.joinedRooms.some((r) => r.id === selection.id)
          : synced.dialogs.some((d) => d.id === selection.id);
      if (!stillExists) {
        startTransition(() => setActiveChat(chooseInitialChat(synced.joinedRooms, synced.dialogs)));
      }
    }

    setProfile(user);
  }

  function pushError(error: unknown) {
    const message = error instanceof ApiError ? error.message : "Something went wrong.";
    setToast({ tone: "error", message });
  }

  function pushInfo(message: string) {
    setToast({ tone: "info", message });
  }

  function queueScrollToBottom() {
    stickToBottomRef.current = true;
    requestAnimationFrame(() => {
      if (messageViewportRef.current) {
        messageViewportRef.current.scrollTop = messageViewportRef.current.scrollHeight;
      }
    });
  }

  function writeSocket(type: string, payload: Record<string, unknown>) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type, payload }));
  }

  function sendPresenceHeartbeat(isActive: boolean) {
    writeSocket("presence.heartbeat", {
      tab_id: tabIdRef.current,
      is_active: isActive,
      last_interaction_at: new Date().toISOString(),
    });
  }

  function subscribeToChat(chat: ActiveChat) {
    writeSocket(chat.kind === "room" ? "room.subscribe" : "dialog.subscribe", {
      [`${chat.kind}_id`]: chat.id,
    });
  }

  function unsubscribeFromChat(chat: ActiveChat) {
    writeSocket(chat.kind === "room" ? "room.unsubscribe" : "dialog.unsubscribe", {
      [`${chat.kind}_id`]: chat.id,
    });
  }

  async function markCurrentChatRead(chat: ActiveChat) {
    try {
      await markChatRead(chat);
      if (chat.kind === "room") {
        setJoinedRooms((current) =>
          current.map((r) => (r.id === chat.id ? { ...r, unread_count: 0 } : r)),
        );
      } else {
        setDialogs((current) =>
          current.map((d) => (d.id === chat.id ? { ...d, unread_count: 0 } : d)),
        );
      }
    } catch {
      // Read updates are best effort on the client; the server remains authoritative.
    }
  }

  function handleSocketEvent(type: string, payload: Record<string, unknown>) {
    const currentUserId = profileRef.current?.id;
    if (!currentUserId) return;

    if (type === "presence.updated") {
      const userId = String(payload.user_id);
      const presence = payload.presence as User["presence"];
      setDialogs((current) =>
        current.map((d) => ({ ...d, other_user: patchPresenceInUser(d.other_user, userId, presence) })),
      );
      setFriends((current) =>
        current.map((f) => ({ ...f, user: patchPresenceInUser(f.user, userId, presence) })),
      );
      setActiveRoomMembers((current) =>
        current.map((m) => ({ ...m, user: patchPresenceInUser(m.user, userId, presence) })),
      );
      return;
    }

    if (type === "friend_request.created") {
      const request = payload.request as IncomingFriendRequest;
      setIncomingRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
      setNotificationSummary((current) => ({
        ...current,
        incoming_friend_requests: current.incoming_friend_requests + 1,
      }));
      pushInfo(`New friend request from ${request.from_user.username}.`);
      return;
    }

    if (type === "friend_request.updated") {
      const request = payload.request as {
        id: string;
        status: "accepted" | "rejected" | "cancelled";
        other_user: User;
        responded_at?: string;
      };
      const next = applyFriendRequestUpdate(
        {
          friends: friendsRef.current,
          incomingRequests: incomingRequestsRef.current,
          outgoingRequests: outgoingRequestsRef.current,
          notificationSummary: notificationSummaryRef.current,
        },
        request,
      );
      setFriends(next.friends);
      setIncomingRequests(next.incomingRequests);
      setOutgoingRequests(next.outgoingRequests);
      setNotificationSummary(next.notificationSummary);
      refreshCurrentShellSilently();
      if (request.status === "accepted") {
        pushInfo(`${request.other_user.username} accepted the friend request.`);
      } else if (request.status === "rejected") {
        pushInfo(`${request.other_user.username} rejected the friend request.`);
      }
      return;
    }

    if (type === "dialog.summary.updated") {
      const dialog = payload.dialog as DialogSummary;
      const isCurrent = activeChatRef.current?.kind === "dialog" && activeChatRef.current.id === dialog.id;
      const nextDialog = isCurrent ? { ...dialog, unread_count: 0 } : dialog;
      setDialogs((current) => upsertDialog(current, nextDialog));
      if (dialog.is_frozen) refreshCurrentShellSilently();
      if (!isCurrent && dialog.last_message && dialog.last_message.sender_id !== currentUserId) {
        pushInfo(`New message from ${dialog.other_user.username}.`);
      }
      return;
    }

    if (type === "room.invitation.created") {
      const invitation = payload.invitation as RoomInvitation;
      setPendingInvitations((current) => [
        { ...invitation, room_name: invitation.room_name ?? "Private room" },
        ...current.filter((item) => item.id !== invitation.id),
      ]);
      pushInfo(`Invitation received for ${invitation.room_name ?? "a private room"}.`);
      return;
    }

    if (type === "room.membership.updated") {
      const roomId = String(payload.room_id);
      const userId = String(payload.user_id);
      const action = String(payload.action);
      if (userId === currentUserId && ["left", "removed", "banned"].includes(action)) {
        if (activeChatRef.current?.kind === "room" && activeChatRef.current.id === roomId) {
          setActiveChat(null);
        }
      }
      refreshCurrentShellSilently();
      if (activeChatRef.current?.kind === "room" && activeChatRef.current.id === roomId) {
        refreshActiveRoomSilently(roomId);
      }
      return;
    }

    if (type === "room.message.created") {
      const message = payload.message as Message;
      setJoinedRooms((current) =>
        current.map((room) => {
          if (room.id !== message.chat_id) return room;
          const isCurrent = activeChatRef.current?.kind === "room" && activeChatRef.current.id === room.id;
          const unread = isCurrent ? 0 : (room.unread_count ?? 0) + (message.sender.id === currentUserId ? 0 : 1);
          return { ...room, unread_count: unread };
        }),
      );
      if (activeChatRef.current?.kind === "room" && activeChatRef.current.id === message.chat_id) {
        setMessages((current) => upsertMessage(current, message));
        if (message.sender.id !== currentUserId && !document.hidden && stickToBottomRef.current) {
          void markCurrentChatRead({ kind: "room", id: message.chat_id });
        }
      }
      return;
    }

    if (type === "dialog.message.created") {
      const message = payload.message as Message;
      setDialogs((current) =>
        current.map((dialog) => {
          if (dialog.id !== message.chat_id) return dialog;
          const isCurrent = activeChatRef.current?.kind === "dialog" && activeChatRef.current.id === dialog.id;
          return {
            ...dialog,
            unread_count: isCurrent ? 0 : dialog.unread_count + (message.sender.id === currentUserId ? 0 : 1),
            last_message: {
              id: message.id,
              sender_id: message.sender.id,
              text: message.text,
              created_at: message.created_at,
            },
          };
        }),
      );
      if (activeChatRef.current?.kind === "dialog" && activeChatRef.current.id === message.chat_id) {
        setMessages((current) => upsertMessage(current, message));
        if (message.sender.id !== currentUserId && !document.hidden && stickToBottomRef.current) {
          void markCurrentChatRead({ kind: "dialog", id: message.chat_id });
        }
      }
      return;
    }

    if (type === "room.message.updated" || type === "dialog.message.updated") {
      const message = payload.message as Message;
      if (isChatEqual(activeChatRef.current, { kind: message.chat_type, id: message.chat_id })) {
        setMessages((current) => upsertMessage(current, message));
      }
      if (message.chat_type === "dialog") {
        setDialogs((current) =>
          current.map((dialog) =>
            dialog.id === message.chat_id && dialog.last_message?.id === message.id
              ? {
                  ...dialog,
                  last_message: {
                    id: message.id,
                    sender_id: message.sender.id,
                    text: message.text,
                    created_at: message.created_at,
                  },
                }
              : dialog,
          ),
        );
      }
      return;
    }

    if (type === "room.message.deleted" || type === "dialog.message.deleted") {
      const chatId = String(payload.room_id ?? payload.dialog_id);
      const messageId = String(payload.message_id);
      if (activeChatRef.current?.id === chatId) {
        setMessages((current) => removeMessage(current, messageId));
      }
      return;
    }

    if (type === "room.read.updated") {
      const roomId = String(payload.room_id);
      const userId = String(payload.user_id);
      if (userId === currentUserId) {
        setJoinedRooms((current) =>
          current.map((r) => (r.id === roomId ? { ...r, unread_count: Number(payload.unread_count) } : r)),
        );
      }
      return;
    }

    if (type === "dialog.read.updated") {
      const dialogId = String(payload.dialog_id);
      const userId = String(payload.user_id);
      if (userId === currentUserId) {
        setDialogs((current) =>
          current.map((d) => (d.id === dialogId ? { ...d, unread_count: Number(payload.unread_count) } : d)),
        );
      }
    }
  }

  function refreshCurrentShellSilently() {
    const currentUser = profileRef.current;
    if (!currentUser) return;
    refreshShell(currentUser, true).catch(() => undefined);
  }

  function refreshActiveRoomSilently(roomId: string) {
    Promise.all([
      fetchRoomDetail(roomId).catch(() => null),
      fetchRoomMembers(roomId).catch(() => []),
      fetchRoomBans(roomId).catch(() => []),
      fetchRoomInvitations(roomId).catch(() => []),
    ])
      .then(([room, members, bans, invitations]) => {
        if (activeChatRef.current?.kind !== "room" || activeChatRef.current.id !== roomId) return;
        setActiveRoom(room);
        setActiveRoomMembers(members);
        setActiveRoomBans(bans);
        setActiveRoomInvitations(invitations);
      })
      .catch(() => undefined);
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const user = await login({ email: loginEmail, password: loginPassword, remember_me: rememberMe });
      setProfile(user);
      await refreshShell(user, false);
      setLoginPassword("");
    } catch (error) {
      pushError(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await register({ email: registerEmail, username: registerUsername, password: registerPassword });
      pushInfo("Registration complete. Sign in with the new account.");
      setAuthMode("login");
      setLoginEmail(registerEmail);
      setRegisterPassword("");
    } catch (error) {
      pushError(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset(resetEmail);
      pushInfo("If the address exists, a reset token has been issued.");
      setAuthMode("login");
    } catch (error) {
      pushError(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      pushError(error);
    } finally {
      setProfile(null);
      setShellStatus("guest");
      setActiveChat(null);
    }
  }

  async function handleSelectChat(nextChat: ActiveChat) {
    if (activeChatRef.current && isChatEqual(activeChatRef.current, nextChat)) return;
    startTransition(() => setActiveChat(nextChat));
  }

  async function handleOpenDialog(friend: FriendItem) {
    try {
      const existing = dialogs.find((d) => d.other_user.id === friend.user.id);
      if (existing) { await handleSelectChat({ kind: "dialog", id: existing.id }); return; }
      const dialog = await ensureDialog(friend.user.id);
      const refreshedDialogs = await fetchDialogs();
      setDialogs(refreshedDialogs);
      await handleSelectChat({ kind: "dialog", id: dialog.id });
    } catch (error) {
      pushError(error);
    }
  }

  async function handleJoinRoom(roomId: string) {
    try {
      await joinRoom(roomId);
      pushInfo("Space joined.");
      refreshCurrentShellSilently();
      await handleSelectChat({ kind: "room", id: roomId });
    } catch (error) {
      pushError(error);
    }
  }

  async function handleLeaveRoom(roomId: string) {
    try {
      await leaveRoom(roomId);
      pushInfo("Space left.");
      refreshCurrentShellSilently();
    } catch (error) {
      pushError(error);
    }
  }

  async function handleLoadOlder() {
    if (!activeChat || !messageCursor || loadingOlder || !messageViewportRef.current) return;
    setLoadingOlder(true);
    restoreScrollRef.current = messageViewportRef.current.scrollHeight;
    try {
      const response = await fetchMessages(activeChat, messageCursor);
      setMessages((current) => [...response.messages, ...current]);
      setMessageCursor(response.pagination.next_cursor);
    } catch (error) {
      pushError(error);
    } finally {
      setLoadingOlder(false);
    }
  }

  async function handleComposerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeChat || (!composerText.trim() && queuedAttachments.length === 0)) return;
    setBusy(true);
    try {
      const message = await sendMessage(activeChat, {
        text: composerText.trim(),
        reply_to_message_id: replyTarget?.id ?? null,
        attachment_ids: queuedAttachments.map((item) => item.id),
      });
      setMessages((current) => upsertMessage(current, message));
      setComposerText("");
      setReplyTarget(null);
      setQueuedAttachments([]);
      setAttachmentComment("");
      queueScrollToBottom();
      await markCurrentChatRead(activeChat);
    } catch (error) {
      pushError(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadAttachment(file, attachmentComment)));
      setQueuedAttachments((current) => [...current, ...uploaded]);
      setAttachmentComment("");
    } catch (error) {
      pushError(error);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function handleRemoveQueuedAttachment(attachmentId: string) {
    try {
      await deleteAttachment(attachmentId);
      setQueuedAttachments((current) => current.filter((item) => item.id !== attachmentId));
    } catch (error) {
      pushError(error);
    }
  }

  async function handleSaveEdit(messageId: string) {
    if (!activeChat) return;
    try {
      const updated = await editMessage(activeChat, messageId, editingText);
      setMessages((current) => upsertMessage(current, updated));
      setEditingMessageId(null);
      setEditingText("");
    } catch (error) {
      pushError(error);
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!activeChat) return;
    try {
      await deleteMessage(activeChat, messageId);
      setMessages((current) => removeMessage(current, messageId));
    } catch (error) {
      pushError(error);
    }
  }

  async function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const room = await createRoom({ name: newRoomName, description: newRoomDescription, visibility: newRoomVisibility });
      setShowCreateRoomModal(false);
      setNewRoomName("");
      setNewRoomDescription("");
      refreshCurrentShellSilently();
      await handleSelectChat({ kind: "room", id: room.id });
    } catch (error) {
      pushError(error);
    }
  }

  async function handleInviteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeRoom) return;
    try {
      await inviteUserToRoom(activeRoom.id, inviteUsername);
      setInviteUsername("");
      pushInfo("Invite sent.");
      refreshActiveRoomSilently(activeRoom.id);
    } catch (error) {
      pushError(error);
    }
  }

  async function handleSaveRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeRoom) return;
    try {
      const updated = await updateRoom(activeRoom.id, {
        name: roomEditName,
        description: roomEditDescription,
        visibility: roomEditVisibility,
      });
      setActiveRoom((current) => (current ? { ...current, ...updated } : current));
      refreshCurrentShellSilently();
      pushInfo("Space updated.");
    } catch (error) {
      pushError(error);
    }
  }

  async function handleDeleteRoom() {
    if (!activeRoom) return;
    try {
      await deleteRoom(activeRoom.id);
      pushInfo("Space deleted.");
      setActiveChat(null);
      refreshCurrentShellSilently();
    } catch (error) {
      pushError(error);
    }
  }

  async function handleSendFriendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await sendFriendRequest(friendRequestUsername, friendRequestMessage);
      pushInfo(`Friend request sent to ${friendRequestUsername}.`);
      setFriendRequestUsername("");
      setFriendRequestMessage("");
      setShowPeopleModal(false);
      refreshCurrentShellSilently();
    } catch (error) {
      pushError(error);
    }
  }

  async function handleAcceptInvitation(invitationId: string) {
    try {
      await acceptRoomInvitation(invitationId);
      setPendingInvitations((current) => current.filter((item) => item.id !== invitationId));
      refreshCurrentShellSilently();
    } catch (error) {
      pushError(error);
    }
  }

  async function handleRejectInvitation(invitationId: string) {
    try {
      await rejectRoomInvitation(invitationId);
      setPendingInvitations((current) => current.filter((item) => item.id !== invitationId));
    } catch (error) {
      pushError(error);
    }
  }

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      setSessions(await fetchSessions());
    } catch (error) {
      pushError(error);
    } finally {
      setSessionsLoading(false);
    }
  }

  async function runAction(action: () => Promise<void>, onSuccess?: () => void) {
    try {
      await action();
      onSuccess?.();
    } catch (error) {
      pushError(error);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (shellStatus === "booting") {
    return (
      <main className="loading-shell">
        <div className="spinner" />
        <p>Opening Meeting Minds...</p>
      </main>
    );
  }

  if (shellStatus === "guest" || !profile) {
    return (
      <>
        <AuthShell
          authMode={authMode}
          busy={busy}
          connectionState={connectionState}
          loginEmail={loginEmail}
          loginPassword={loginPassword}
          onLoginSubmit={handleLoginSubmit}
          onRegisterSubmit={handleRegisterSubmit}
          onResetSubmit={handleResetSubmit}
          onSetAuthMode={setAuthMode}
          onSetLoginEmail={setLoginEmail}
          onSetLoginPassword={setLoginPassword}
          onSetRegisterEmail={setRegisterEmail}
          onSetRegisterPassword={setRegisterPassword}
          onSetRegisterUsername={setRegisterUsername}
          onSetRememberMe={setRememberMe}
          onSetResetEmail={setResetEmail}
          registerEmail={registerEmail}
          registerPassword={registerPassword}
          registerUsername={registerUsername}
          rememberMe={rememberMe}
          resetEmail={resetEmail}
        />
        {toast ? <Toast tone={toast.tone} message={toast.message} /> : null}
      </>
    );
  }

  const currentDialog =
    activeChat?.kind === "dialog" ? dialogs.find((d) => d.id === activeChat.id) ?? null : null;
  const activeFriend = currentDialog
    ? friends.find((f) => f.user.id === currentDialog.other_user.id) ?? null
    : null;
  const activePeerBan = currentDialog
    ? peerBans.find((b) => b.user.id === currentDialog.other_user.id) ?? null
    : null;
  const unreadRooms = joinedRooms.filter((r) => (r.unread_count ?? 0) > 0).length;
  const unreadDialogs = dialogs.filter((d) => d.unread_count > 0).length;

  return (
    <>
      <main className="app-shell">
        <header className="topbar">
          <div className="brand-block">
            <div className="eyebrow">Meeting Minds</div>
            <h1>Shared spaces and direct conversations</h1>
            <p className="brand-subtitle">
              A focused place for messages, files, people, and live presence.
            </p>
          </div>
          <div className="topbar-meta">
            <div className="connection-pill" data-state={connectionState}>
              {connectionState === "open" ? "Live" : connectionState === "connecting" ? "Connecting" : "Offline"}
            </div>
            <div className="topbar-actions">
              <button className="ghost-button" onClick={() => setShowCreateRoomModal(true)}>New Space</button>
              <button className="ghost-button" onClick={() => setShowPeopleModal(true)}>People</button>
              <button className="ghost-button" onClick={() => { setShowSessionsModal(true); void loadSessions(); }}>
                Sessions
              </button>
            </div>
            <div className="profile-card">
              <div>
                <strong>{profile.username}</strong>
                <span>{profile.email}</span>
              </div>
              <button className="ghost-button" onClick={handleLogout}>Log Out</button>
            </div>
          </div>
        </header>

        <section className="workspace">
          <Sidebar
            activeChat={activeChat}
            dialogs={dialogs}
            friends={friends}
            incomingRequests={incomingRequests}
            joinedRooms={joinedRooms}
            notificationSummary={notificationSummary}
            onAcceptFriendRequest={(id) => void runAction(() => acceptFriendRequest(id), refreshCurrentShellSilently)}
            onAcceptInvitation={handleAcceptInvitation}
            onJoinRoom={handleJoinRoom}
            onOpenDialog={handleOpenDialog}
            onRejectFriendRequest={(id) => void runAction(() => rejectFriendRequest(id), refreshCurrentShellSilently)}
            onRejectInvitation={handleRejectInvitation}
            onSelectChat={handleSelectChat}
            onSetPublicSearch={setPublicSearch}
            onSetSidebarTab={setSidebarTab}
            pendingInvitations={pendingInvitations}
            publicRooms={publicRooms}
            publicSearch={publicSearch}
            sidebarTab={sidebarTab}
            unreadDialogs={unreadDialogs}
            unreadRooms={unreadRooms}
          />

          <section className="conversation">
            {activeChat ? (
              <ConversationPanel
                activeChat={activeChat}
                activeRoom={activeRoom}
                attachmentComment={attachmentComment}
                busy={busy}
                composerText={composerText}
                currentDialog={currentDialog}
                editingMessageId={editingMessageId}
                editingText={editingText}
                loadingOlder={loadingOlder}
                messageCursor={messageCursor}
                messages={messages}
                messagesLoading={messagesLoading}
                onClearReplyTarget={() => setReplyTarget(null)}
                onComposerSubmit={handleComposerSubmit}
                onDeleteMessage={handleDeleteMessage}
                onFileSelection={handleFileSelection}
                onLeaveRoom={handleLeaveRoom}
                onLoadOlder={handleLoadOlder}
                onRemoveQueuedAttachment={handleRemoveQueuedAttachment}
                onSaveEdit={handleSaveEdit}
                onSetAttachmentComment={setAttachmentComment}
                onSetComposerText={setComposerText}
                onSetEditingMessageId={setEditingMessageId}
                onSetEditingText={setEditingText}
                onSetReplyTarget={setReplyTarget}
                profile={profile}
                queuedAttachments={queuedAttachments}
                replyTarget={replyTarget}
                stickToBottomRef={stickToBottomRef}
                viewportRef={messageViewportRef}
              />
            ) : (
              <div className="empty-history">
                <h2>Select a space or conversation</h2>
                <p>The left side shows your joined spaces, searchable open spaces, people, and pending invites.</p>
              </div>
            )}
          </section>

          <ContextPanel
            activeChat={activeChat}
            activeFriend={activeFriend}
            activePeerBan={activePeerBan}
            activeRoom={activeRoom}
            activeRoomBans={activeRoomBans}
            activeRoomInvitations={activeRoomInvitations}
            activeRoomMembers={activeRoomMembers}
            currentDialog={currentDialog}
            inviteUsername={inviteUsername}
            onBanUser={(userId) => {
              if (activeRoom) void runAction(() => banRoomUser(activeRoom.id, userId), () => refreshActiveRoomSilently(activeRoom.id));
            }}
            onCreatePeerBan={(userId) => void runAction(() => createPeerBan(userId), refreshCurrentShellSilently)}
            onDeleteRoom={handleDeleteRoom}
            onDemoteAdmin={(userId) => {
              if (activeRoom) void runAction(() => demoteRoomAdmin(activeRoom.id, userId), () => refreshActiveRoomSilently(activeRoom.id));
            }}
            onInviteUser={handleInviteUser}
            onPromoteAdmin={(userId) => {
              if (activeRoom) void runAction(() => promoteRoomAdmin(activeRoom.id, userId), () => refreshActiveRoomSilently(activeRoom.id));
            }}
            onRemoveFriend={(userId) => void runAction(() => removeFriend(userId), refreshCurrentShellSilently)}
            onRemoveMember={(userId) => {
              if (activeRoom) void runAction(() => removeRoomMember(activeRoom.id, userId), () => refreshActiveRoomSilently(activeRoom.id));
            }}
            onRemovePeerBan={(userId) => void runAction(() => removePeerBan(userId), refreshCurrentShellSilently)}
            onSaveRoom={handleSaveRoom}
            onSetInviteUsername={setInviteUsername}
            onSetRoomEditDescription={setRoomEditDescription}
            onSetRoomEditName={setRoomEditName}
            onSetRoomEditVisibility={setRoomEditVisibility}
            onUnbanUser={(userId) => {
              if (activeRoom) void runAction(() => unbanRoomUser(activeRoom.id, userId), () => refreshActiveRoomSilently(activeRoom.id));
            }}
            roomEditDescription={roomEditDescription}
            roomEditName={roomEditName}
            roomEditVisibility={roomEditVisibility}
          />
        </section>
      </main>

      {showCreateRoomModal ? (
        <CreateRoomModal
          newRoomDescription={newRoomDescription}
          newRoomName={newRoomName}
          newRoomVisibility={newRoomVisibility}
          onClose={() => setShowCreateRoomModal(false)}
          onSetDescription={setNewRoomDescription}
          onSetName={setNewRoomName}
          onSetVisibility={setNewRoomVisibility}
          onSubmit={handleCreateRoom}
        />
      ) : null}

      {showPeopleModal ? (
        <PeopleModal
          friendRequestMessage={friendRequestMessage}
          friendRequestUsername={friendRequestUsername}
          onClose={() => setShowPeopleModal(false)}
          onRemovePeerBan={(userId) => void runAction(() => removePeerBan(userId), refreshCurrentShellSilently)}
          onSetMessage={setFriendRequestMessage}
          onSetUsername={setFriendRequestUsername}
          onSubmit={handleSendFriendRequest}
          outgoingRequests={outgoingRequests}
          peerBans={peerBans}
        />
      ) : null}

      {showSessionsModal ? (
        <SessionsModal
          onClose={() => setShowSessionsModal(false)}
          onRevokeSession={(id) => void runAction(() => revokeSession(id), loadSessions)}
          sessions={sessions}
          sessionsLoading={sessionsLoading}
        />
      ) : null}

      {toast ? <Toast tone={toast.tone} message={toast.message} /> : null}
    </>
  );
}
