import type { FormEvent } from "react";
import type { OutgoingFriendRequest, PeerBan } from "../../types";
import { formatRelative } from "../../lib/chatUtils";
import { Modal } from "../Modal";

interface PeopleModalProps {
  friendRequestUsername: string;
  friendRequestMessage: string;
  outgoingRequests: OutgoingFriendRequest[];
  peerBans: PeerBan[];
  onSetUsername: (v: string) => void;
  onSetMessage: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onRemovePeerBan: (userId: string) => void;
  onClose: () => void;
}

export function PeopleModal({
  friendRequestUsername,
  friendRequestMessage,
  outgoingRequests,
  peerBans,
  onSetUsername,
  onSetMessage,
  onSubmit,
  onRemovePeerBan,
  onClose,
}: PeopleModalProps) {
  return (
    <Modal onClose={onClose} title="People">
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Username
          <input
            onChange={(e) => onSetUsername(e.target.value)}
            required
            value={friendRequestUsername}
          />
        </label>
        <label>
          Message
          <textarea
            onChange={(e) => onSetMessage(e.target.value)}
            rows={3}
            value={friendRequestMessage}
          />
        </label>
        <button className="primary-button" type="submit">
          Send Connection Request
        </button>
      </form>

      {outgoingRequests.length ? (
        <section className="panel-card">
          <div className="section-title">Sent Requests</div>
          {outgoingRequests.map((request) => (
            <div className="list-card" key={request.id}>
              <div>
                <strong>{request.to_user.username}</strong>
                <span>{request.message || "No message"}</span>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {peerBans.length ? (
        <section className="panel-card">
          <div className="section-title">Blocked People</div>
          {peerBans.map((ban) => (
            <div className="list-card" key={ban.user.id}>
              <div>
                <strong>{ban.user.username}</strong>
                <span>{formatRelative(ban.created_at)}</span>
              </div>
              <button
                className="mini-button positive"
                onClick={() => onRemovePeerBan(ban.user.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </section>
      ) : null}
    </Modal>
  );
}
