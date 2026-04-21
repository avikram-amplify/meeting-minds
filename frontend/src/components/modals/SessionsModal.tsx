import type { SessionRecord } from "../../types";
import { Modal } from "../Modal";

interface SessionsModalProps {
  sessions: SessionRecord[];
  sessionsLoading: boolean;
  onRevokeSession: (id: string) => void;
  onClose: () => void;
}

export function SessionsModal({
  sessions,
  sessionsLoading,
  onRevokeSession,
  onClose,
}: SessionsModalProps) {
  return (
    <Modal onClose={onClose} title="Active Sessions">
      {sessionsLoading ? <p className="empty-copy">Loading sessions...</p> : null}
      {sessions.map((session) => (
        <div className="list-card" key={session.id}>
          <div>
            <strong>{session.is_current ? "This device" : "Signed-in device"}</strong>
            <span>{session.user_agent || "Unknown agent"}</span>
            <span>{session.ip_address || "Unknown IP"}</span>
          </div>
          {!session.is_current ? (
            <button
              className="mini-button danger"
              onClick={() => onRevokeSession(session.id)}
            >
              Sign Out
            </button>
          ) : (
            <span className="warning-chip">Current</span>
          )}
        </div>
      ))}
    </Modal>
  );
}
