import type { MutableRefObject } from "react";
import type { ActiveChat, Message, RoomDetail, User } from "../../types";
import type { QueuedAttachment } from "../../types/app";
import { formatTimestamp } from "../../lib/chatUtils";
import { IconButton } from "../Icon";
import { MessageAttachmentCard } from "../MessageAttachmentCard";
import { toPublicUrl } from "../../lib/api";

interface MessageHistoryProps {
  activeChat: ActiveChat;
  messages: Message[];
  messagesLoading: boolean;
  loadingOlder: boolean;
  messageCursor: string | null;
  editingMessageId: string | null;
  editingText: string;
  profile: User;
  activeRoom: RoomDetail | null;
  viewportRef: MutableRefObject<HTMLDivElement | null>;
  stickToBottomRef: MutableRefObject<boolean>;
  onLoadOlder: () => void;
  onSetEditingMessageId: (id: string | null) => void;
  onSetEditingText: (text: string) => void;
  onSaveEdit: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onSetReplyTarget: (message: Message) => void;
}

export function MessageHistory({
  activeChat,
  messages,
  messagesLoading,
  loadingOlder,
  messageCursor,
  editingMessageId,
  editingText,
  profile,
  activeRoom,
  viewportRef,
  stickToBottomRef,
  onLoadOlder,
  onSetEditingMessageId,
  onSetEditingText,
  onSaveEdit,
  onDeleteMessage,
  onSetReplyTarget,
}: MessageHistoryProps) {
  return (
    <div
      className="message-history"
      onScroll={(e) => {
        const target = e.currentTarget;
        stickToBottomRef.current =
          target.scrollHeight - target.scrollTop - target.clientHeight < 80;
        if (target.scrollTop < 80) {
          onLoadOlder();
        }
      }}
      ref={viewportRef}
    >
      {loadingOlder ? (
        <div className="history-banner">Loading older messages...</div>
      ) : null}
      {messageCursor ? (
        <div className="history-banner">Scroll upward to load more history.</div>
      ) : null}
      {messagesLoading ? (
        <div className="history-banner">Loading conversation...</div>
      ) : null}
      {!messagesLoading && !messages.length ? (
        <div className="empty-history">
          <h3>Start the conversation</h3>
          <p>History comes from the API, and fresh updates arrive through the live socket.</p>
        </div>
      ) : null}

      {messages.map((message) => {
        const isOwn = message.sender.id === profile.id;
        const canDelete =
          isOwn ||
          (activeChat.kind === "room" &&
            ["owner", "admin"].includes(activeRoom?.current_user_role ?? "member"));

        return (
          <article className={`message-card ${isOwn ? "is-own" : ""}`} key={message.id}>
            <header>
              <strong>{message.sender.username}</strong>
              <span>{formatTimestamp(message.created_at)}</span>
            </header>

            {message.reply_to ? (
              <div className="reply-chip">
                Replying to {message.reply_to.sender.username}:{" "}
                {message.reply_to.text || "Attachment"}
              </div>
            ) : null}

            {editingMessageId === message.id ? (
              <div className="edit-box">
                <textarea
                  onChange={(e) => onSetEditingText(e.target.value)}
                  rows={3}
                  value={editingText}
                />
                <div className="inline-actions">
                  <IconButton
                    icon="save"
                    label="Save edit"
                    onClick={() => onSaveEdit(message.id)}
                    variant="positive"
                  />
                  <IconButton
                    icon="cancel"
                    label="Cancel edit"
                    onClick={() => {
                      onSetEditingMessageId(null);
                      onSetEditingText("");
                    }}
                    variant="danger"
                  />
                </div>
              </div>
            ) : (
              <p>{message.text || "Attachment-only message"}</p>
            )}

            {message.attachments.length ? (
              <div className="attachment-list">
                {message.attachments.map((attachment) => (
                  <MessageAttachmentCard
                    attachment={attachment}
                    attachmentUrl={toPublicUrl(attachment.download_url)}
                    key={attachment.id}
                  />
                ))}
              </div>
            ) : null}

            <footer>
              <span>{message.is_edited ? "edited" : "posted"}</span>
              <div className="inline-actions">
                <IconButton
                  icon="reply"
                  label="Reply"
                  onClick={() => onSetReplyTarget(message)}
                  variant="positive"
                />
                {isOwn ? (
                  <IconButton
                    icon="edit"
                    label="Edit message"
                    onClick={() => {
                      onSetEditingMessageId(message.id);
                      onSetEditingText(message.text);
                    }}
                    variant="positive"
                  />
                ) : null}
                {canDelete ? (
                  <IconButton
                    icon="delete"
                    label="Delete message"
                    onClick={() => onDeleteMessage(message.id)}
                    variant="danger"
                  />
                ) : null}
              </div>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
