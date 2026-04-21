import type { ChangeEvent, FormEvent } from "react";
import type { ActiveChat, DialogSummary, Message } from "../../types";
import type { QueuedAttachment } from "../../types/app";
import { Icon, IconButton } from "../Icon";

interface MessageComposerProps {
  activeChat: ActiveChat;
  currentDialog: DialogSummary | null;
  composerText: string;
  replyTarget: Message | null;
  queuedAttachments: QueuedAttachment[];
  attachmentComment: string;
  busy: boolean;
  onSetComposerText: (v: string) => void;
  onSetAttachmentComment: (v: string) => void;
  onClearReplyTarget: () => void;
  onRemoveQueuedAttachment: (id: string) => void;
  onFileSelection: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function MessageComposer({
  activeChat,
  currentDialog,
  composerText,
  replyTarget,
  queuedAttachments,
  attachmentComment,
  busy,
  onSetComposerText,
  onSetAttachmentComment,
  onClearReplyTarget,
  onRemoveQueuedAttachment,
  onFileSelection,
  onSubmit,
}: MessageComposerProps) {
  const isFrozen = activeChat.kind === "dialog" && currentDialog?.is_frozen;

  return (
    <form className="composer" onSubmit={onSubmit}>
      {replyTarget ? (
        <div className="composer-banner">
          Replying to {replyTarget.sender.username}: {replyTarget.text || "Attachment"}
          <IconButton
            icon="clear"
            label="Clear reply target"
            onClick={onClearReplyTarget}
            variant="danger"
          />
        </div>
      ) : null}

      {queuedAttachments.length ? (
        <div className="composer-banner">
          {queuedAttachments.map((attachment) => (
            <span className="queued-chip" key={attachment.id}>
              {attachment.filename}
              <button onClick={() => onRemoveQueuedAttachment(attachment.id)} type="button">
                x
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <textarea
        onChange={(e) => onSetComposerText(e.target.value)}
        placeholder={
          isFrozen
            ? "This dialog is frozen by friendship or peer-ban rules."
            : "Write a message"
        }
        rows={4}
        value={composerText}
      />

      <div className="composer-tools">
        <label aria-label="Attach files" className="file-label icon-button" title="Attach files">
          <Icon name="attach" />
          <span className="sr-only">Attach files</span>
          <input multiple onChange={onFileSelection} type="file" />
        </label>
        <input
          onChange={(e) => onSetAttachmentComment(e.target.value)}
          placeholder="Attachment comment"
          value={attachmentComment}
        />
        <IconButton
          disabled={busy || isFrozen}
          icon="send"
          label="Send message"
          type="submit"
          variant="positive"
        />
      </div>
    </form>
  );
}
