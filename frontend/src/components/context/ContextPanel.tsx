import type { FormEvent } from "react";
import type {
  ActiveChat,
  DialogSummary,
  FriendItem,
  PeerBan,
  RoomBan,
  RoomDetail,
  RoomInvitation,
  RoomMember,
} from "../../types";
import { formatTimestamp, formatRelative } from "../../lib/chatUtils";
import { IconButton } from "../Icon";

interface ContextPanelProps {
  activeChat: ActiveChat | null;
  activeRoom: RoomDetail | null;
  activeRoomMembers: RoomMember[];
  activeRoomBans: RoomBan[];
  activeRoomInvitations: RoomInvitation[];
  currentDialog: DialogSummary | null;
  activeFriend: FriendItem | null;
  activePeerBan: PeerBan | null;
  inviteUsername: string;
  roomEditName: string;
  roomEditDescription: string;
  roomEditVisibility: RoomDetail["visibility"];
  onSetInviteUsername: (v: string) => void;
  onSetRoomEditName: (v: string) => void;
  onSetRoomEditDescription: (v: string) => void;
  onSetRoomEditVisibility: (v: RoomDetail["visibility"]) => void;
  onInviteUser: (e: FormEvent<HTMLFormElement>) => void;
  onSaveRoom: (e: FormEvent<HTMLFormElement>) => void;
  onDeleteRoom: () => void;
  onPromoteAdmin: (userId: string) => void;
  onDemoteAdmin: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
  onBanUser: (userId: string) => void;
  onUnbanUser: (userId: string) => void;
  onRemoveFriend: (userId: string) => void;
  onCreatePeerBan: (userId: string) => void;
  onRemovePeerBan: (userId: string) => void;
}

export function ContextPanel({
  activeChat,
  activeRoom,
  activeRoomMembers,
  activeRoomBans,
  activeRoomInvitations,
  currentDialog,
  activeFriend,
  activePeerBan,
  inviteUsername,
  roomEditName,
  roomEditDescription,
  roomEditVisibility,
  onSetInviteUsername,
  onSetRoomEditName,
  onSetRoomEditDescription,
  onSetRoomEditVisibility,
  onInviteUser,
  onSaveRoom,
  onDeleteRoom,
  onPromoteAdmin,
  onDemoteAdmin,
  onRemoveMember,
  onBanUser,
  onUnbanUser,
  onRemoveFriend,
  onCreatePeerBan,
  onRemovePeerBan,
}: ContextPanelProps) {
  if (activeChat?.kind === "room" && activeRoom) {
    return (
      <aside className="context-panel">
        <section className="panel-card">
          <div className="section-title">Space Details</div>
          <div className="detail-grid">
            <span>Owner</span>
            <strong>{activeRoom.owner.username}</strong>
            <span>Visibility</span>
            <strong>{activeRoom.visibility}</strong>
            <span>Members</span>
            <strong>{activeRoom.member_count}</strong>
            <span>Your role</span>
            <strong>{activeRoom.current_user_role}</strong>
          </div>
        </section>

        <section className="panel-card">
          <div className="section-title">People In This Space</div>
          {activeRoomMembers.map((member) => (
            <div className="list-card" key={member.user.id}>
              <div className="list-card-content">
                <strong>{member.user.username}</strong>
                <span>
                  {member.role} - {member.user.presence ?? "offline"}
                </span>
              </div>
              <div className="list-card-actions">
                {activeRoom.current_user_role === "owner" && member.role === "member" ? (
                  <IconButton
                    icon="promote"
                    label={`Promote ${member.user.username} to admin`}
                    onClick={() => onPromoteAdmin(member.user.id)}
                    variant="positive"
                  />
                ) : null}
                {activeRoom.current_user_role === "owner" && member.role === "admin" ? (
                  <IconButton
                    icon="demote"
                    label={`Demote ${member.user.username} from admin`}
                    onClick={() => onDemoteAdmin(member.user.id)}
                    variant="danger"
                  />
                ) : null}
                {["owner", "admin"].includes(activeRoom.current_user_role) &&
                member.role !== "owner" ? (
                  <>
                    <IconButton
                      icon="remove"
                      label={`Remove ${member.user.username} from space`}
                      onClick={() => onRemoveMember(member.user.id)}
                      variant="danger"
                    />
                    <IconButton
                      icon="ban"
                      label={`Ban ${member.user.username} from space`}
                      onClick={() => onBanUser(member.user.id)}
                      variant="danger"
                    />
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </section>

        {["owner", "admin"].includes(activeRoom.current_user_role) ? (
          <>
            <section className="panel-card">
              <div className="section-title">Invite To Space</div>
              <form className="stack-form" onSubmit={onInviteUser}>
                <input
                  onChange={(e) => onSetInviteUsername(e.target.value)}
                  placeholder="username"
                  value={inviteUsername}
                />
                <IconButton icon="invite" label="Send space invite" type="submit" variant="positive" />
              </form>
            </section>

            <section className="panel-card">
              <div className="section-title">Active Bans</div>
              {activeRoomBans.length ? (
                activeRoomBans.map((ban) => (
                  <div className="list-card" key={ban.user.id}>
                    <div className="list-card-content">
                      <strong>{ban.user.username}</strong>
                      <span>by {ban.banned_by.username}</span>
                    </div>
                    <div className="list-card-actions">
                      <IconButton
                        icon="unban"
                        label={`Unban ${ban.user.username}`}
                        onClick={() => onUnbanUser(ban.user.id)}
                        variant="positive"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-copy">No active bans.</p>
              )}
            </section>

            <section className="panel-card">
              <div className="section-title">Pending Invites</div>
              {activeRoomInvitations.length ? (
                activeRoomInvitations.map((invitation) => (
                  <div className="list-card" key={invitation.id}>
                    <div className="list-card-content">
                      <strong>{invitation.user?.username ?? "Pending user"}</strong>
                      <span>{formatRelative(invitation.created_at)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-copy">No pending space invites.</p>
              )}
            </section>
          </>
        ) : null}

        {activeRoom.current_user_role === "owner" ? (
          <section className="panel-card danger-card">
            <div className="section-title">Space Controls</div>
            <form className="stack-form" onSubmit={onSaveRoom}>
              <input
                onChange={(e) => onSetRoomEditName(e.target.value)}
                value={roomEditName}
              />
              <textarea
                onChange={(e) => onSetRoomEditDescription(e.target.value)}
                rows={3}
                value={roomEditDescription}
              />
              <select
                onChange={(e) =>
                  onSetRoomEditVisibility(e.target.value as RoomDetail["visibility"])
                }
                value={roomEditVisibility}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <button className="primary-button" type="submit">
                Save Space
              </button>
            </form>
            <button className="danger-button" onClick={onDeleteRoom}>
              Delete Space
            </button>
          </section>
        ) : null}
      </aside>
    );
  }

  if (currentDialog) {
    return (
      <aside className="context-panel">
        <section className="panel-card">
          <div className="section-title">Person</div>
          <div className="detail-grid">
            <span>User</span>
            <strong>{currentDialog.other_user.username}</strong>
            <span>Presence</span>
            <strong>{currentDialog.other_user.presence ?? "offline"}</strong>
            <span>Status</span>
            <strong>{currentDialog.is_frozen ? "Frozen" : "Active"}</strong>
          </div>
        </section>

        <section className="panel-card">
          <div className="section-title">Connection</div>
          {activeFriend ? (
            <p className="empty-copy">
              Connected since {formatTimestamp(activeFriend.friend_since)}
            </p>
          ) : (
            <p className="empty-copy">Not in your people list yet.</p>
          )}
          <div className="inline-actions wrap">
            {activeFriend ? (
              <IconButton
                icon="friend-remove"
                label={`Remove ${currentDialog.other_user.username} from friends`}
                onClick={() => onRemoveFriend(activeFriend.user.id)}
                variant="danger"
              />
            ) : null}
            {activePeerBan ? (
              <IconButton
                icon="peer-unban"
                label={`Remove peer ban for ${currentDialog.other_user.username}`}
                onClick={() => onRemovePeerBan(activePeerBan.user.id)}
                variant="positive"
              />
            ) : (
              <IconButton
                icon="peer-ban"
                label={`Create peer ban for ${currentDialog.other_user.username}`}
                onClick={() => onCreatePeerBan(currentDialog.other_user.id)}
                variant="danger"
              />
            )}
          </div>
        </section>
      </aside>
    );
  }

  return (
    <aside className="context-panel">
      <section className="panel-card">
        <div className="section-title">Context</div>
        <p className="empty-copy">
          People, moderation tools, and conversation context appear here for the selected thread.
        </p>
      </section>
    </aside>
  );
}
