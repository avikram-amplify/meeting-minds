import type {
  ActiveChat,
  DialogSummary,
  FriendItem,
  IncomingFriendRequest,
  NotificationSummary,
  RoomInvitation,
  RoomListItem,
} from "../../types";
import type { SidebarTab } from "../../types/app";
import { compactCount, formatRelative } from "../../lib/chatUtils";

interface SidebarProps {
  sidebarTab: SidebarTab;
  activeChat: ActiveChat | null;
  joinedRooms: RoomListItem[];
  publicRooms: RoomListItem[];
  publicSearch: string;
  dialogs: DialogSummary[];
  friends: FriendItem[];
  incomingRequests: IncomingFriendRequest[];
  pendingInvitations: RoomInvitation[];
  notificationSummary: NotificationSummary;
  unreadRooms: number;
  unreadDialogs: number;
  onSetSidebarTab: (tab: SidebarTab) => void;
  onSetPublicSearch: (v: string) => void;
  onSelectChat: (chat: ActiveChat) => void;
  onJoinRoom: (roomId: string) => void;
  onOpenDialog: (friend: FriendItem) => void;
  onAcceptInvitation: (id: string) => void;
  onRejectInvitation: (id: string) => void;
  onAcceptFriendRequest: (id: string) => void;
  onRejectFriendRequest: (id: string) => void;
}

export function Sidebar({
  sidebarTab,
  activeChat,
  joinedRooms,
  publicRooms,
  publicSearch,
  dialogs,
  friends,
  incomingRequests,
  pendingInvitations,
  notificationSummary,
  unreadRooms,
  unreadDialogs,
  onSetSidebarTab,
  onSetPublicSearch,
  onSelectChat,
  onJoinRoom,
  onOpenDialog,
  onAcceptInvitation,
  onRejectInvitation,
  onAcceptFriendRequest,
  onRejectFriendRequest,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button
          className={sidebarTab === "rooms" ? "is-active" : ""}
          onClick={() => onSetSidebarTab("rooms")}
        >
          Spaces
          {unreadRooms ? <span className="badge">{compactCount(unreadRooms)}</span> : null}
        </button>
        <button
          className={sidebarTab === "people" ? "is-active" : ""}
          onClick={() => onSetSidebarTab("people")}
        >
          People
          {unreadDialogs || notificationSummary.incoming_friend_requests ? (
            <span className="badge">
              {compactCount(unreadDialogs + notificationSummary.incoming_friend_requests)}
            </span>
          ) : null}
        </button>
      </div>

      {sidebarTab === "rooms" ? (
        <>
          <section className="sidebar-section">
            <div className="section-title">Joined Spaces</div>
            {joinedRooms.length ? (
              joinedRooms.map((room) => (
                <button
                  className={`list-item ${activeChat?.kind === "room" && activeChat.id === room.id ? "is-selected" : ""}`}
                  key={room.id}
                  onClick={() => onSelectChat({ kind: "room", id: room.id })}
                >
                  <div>
                    <strong>{room.name}</strong>
                    <span>{room.visibility === "private" ? "Private space" : "Open space"}</span>
                  </div>
                  {(room.unread_count ?? 0) > 0 ? (
                    <span className="badge">{compactCount(room.unread_count ?? 0)}</span>
                  ) : null}
                </button>
              ))
            ) : (
              <p className="empty-copy">No spaces joined yet.</p>
            )}
          </section>

          <section className="sidebar-section">
            <div className="section-title">Explore Spaces</div>
            <input
              className="search-input"
              onChange={(e) => onSetPublicSearch(e.target.value)}
              placeholder="Search open spaces"
              value={publicSearch}
            />
            {publicRooms.map((room) => {
              const isJoined = joinedRooms.some((j) => j.id === room.id);
              return (
                <div className="list-card" key={room.id}>
                  <div>
                    <strong>{room.name}</strong>
                    <span>{room.member_count} people inside</span>
                  </div>
                  <button
                    className="mini-button positive"
                    disabled={isJoined}
                    onClick={() => onJoinRoom(room.id)}
                  >
                    {isJoined ? "Joined" : "Join"}
                  </button>
                </div>
              );
            })}
          </section>

          {pendingInvitations.length ? (
            <section className="sidebar-section">
              <div className="section-title">Pending Invites</div>
              {pendingInvitations.map((invitation) => (
                <div className="list-card" key={invitation.id}>
                  <div>
                    <strong>{invitation.room_name ?? invitation.room_id}</strong>
                    <span>{formatRelative(invitation.created_at)}</span>
                  </div>
                  <div className="inline-actions">
                    <button
                      className="mini-button positive"
                      onClick={() => onAcceptInvitation(invitation.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="mini-button danger"
                      onClick={() => onRejectInvitation(invitation.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </section>
          ) : null}
        </>
      ) : (
        <>
          <section className="sidebar-section">
            <div className="section-title">Direct Conversations</div>
            {dialogs.length ? (
              dialogs.map((dialog) => (
                <button
                  className={`list-item ${activeChat?.kind === "dialog" && activeChat.id === dialog.id ? "is-selected" : ""}`}
                  key={dialog.id}
                  onClick={() => onSelectChat({ kind: "dialog", id: dialog.id })}
                >
                  <div>
                    <strong>{dialog.other_user.username}</strong>
                    <span>
                      {dialog.other_user.presence ?? "offline"}
                      {dialog.is_frozen ? " - frozen" : ""}
                    </span>
                  </div>
                  {dialog.unread_count > 0 ? (
                    <span className="badge">{compactCount(dialog.unread_count)}</span>
                  ) : null}
                </button>
              ))
            ) : (
              <p className="empty-copy">No direct conversations yet.</p>
            )}
          </section>

          <section className="sidebar-section">
            <div className="section-title">People</div>
            {friends.length ? (
              friends.map((friend) => (
                <div className="list-card" key={friend.user.id}>
                  <div>
                    <strong>{friend.user.username}</strong>
                    <span>{friend.user.presence ?? "offline"}</span>
                  </div>
                  <button
                    className="mini-button positive"
                    onClick={() => onOpenDialog(friend)}
                  >
                    Open
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-copy">No people added yet.</p>
            )}
          </section>

          <section className="sidebar-section">
            <div className="section-title">Connection Requests</div>
            {incomingRequests.length ? (
              incomingRequests.map((request) => (
                <div className="list-card" key={request.id}>
                  <div>
                    <strong>{request.from_user.username}</strong>
                    <span>{request.message || "No message"}</span>
                  </div>
                  <div className="inline-actions">
                    <button
                      className="mini-button positive"
                      onClick={() => onAcceptFriendRequest(request.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="mini-button danger"
                      onClick={() => onRejectFriendRequest(request.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-copy">No incoming requests.</p>
            )}
          </section>
        </>
      )}
    </aside>
  );
}
