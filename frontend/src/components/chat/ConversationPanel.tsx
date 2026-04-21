import type { ChangeEvent, FormEvent, MutableRefObject } from "react";
import type {
  ActiveChat,
  DialogSummary,
  Message,
  RoomDetail,
  User,
} from "../../types";
import type { QueuedAttachment } from "../../types/app";
import { IconButton } from "../Icon";
import { MessageHistory } from "./MessageHistory";
import { MessageComposer } from "./MessageComposer";

interface ConversationPanelProps {
  activeChat: ActiveChat;
  profile: User;
  activeRoom: RoomDetail | null;
  currentDialog: DialogSummary | null;
  messages: Message[];
  messagesLoading: boolean;
  loadingOlder: boolean;
  messageCursor: string | null;
  editingMessageId: string | null;
  editingText: string;
  composerText: string;
  replyTarget: Message | null;
  queuedAttachments: QueuedAttachment[];
  attachmentComment: string;
  busy: boolean;
  viewportRef: MutableRefObject<HTMLDivElement | null>;
  stickToBottomRef: MutableRefObject<boolean>;
  onLoadOlder: () => void;
  onLeaveRoom: (id: string) => void;
  onSetEditingMessageId: (id: string | null) => void;
  onSetEditingText: (text: string) => void;
  onSaveEdit: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onSetReplyTarget: (message: Message) => void;
  onSetComposerText: (v: string) => void;
  onSetAttachmentComment: (v: string) => void;
  onClearReplyTarget: () => void;
  onRemoveQueuedAttachment: (id: string) => void;
  onFileSelection: (e: ChangeEvent<HTMLInputElement>) => void;
  onComposerSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function ConversationPanel({
  activeChat,
  profile,
  activeRoom,
  currentDialog,
  messages,
  messagesLoading,
  loadingOlder,
  messageCursor,
  editingMessageId,
  editingText,
  composerText,
  replyTarget,
  queuedAttachments,
  attachmentComment,
  busy,
  viewportRef,
  stickToBottomRef,
  onLoadOlder,
  onLeaveRoom,
  onSetEditingMessageId,
  onSetEditingText,
  onSaveEdit,
  onDeleteMessage,
  onSetReplyTarget,
  onSetComposerText,
  onSetAttachmentComment,
  onClearReplyTarget,
  onRemoveQueuedAttachment,
  onFileSelection,
  onComposerSubmit,
}: ConversationPanelProps) {
  return (
    <>
      <header className="conversation-header">
        <div>
          <div className="eyebrow">
            {activeChat.kind === "room"
              ? (activeRoom?.visibility ?? "space")
              : "direct conversation"}
          </div>
          <h2>
            {activeChat.kind === "room"
              ? (activeRoom?.name ?? "Space")
              : (currentDialog?.other_user.username ?? "Conversation")}
          </h2>
        </div>
        <div className="conversation-actions">
          {activeChat.kind === "room" ? (
            <IconButton
              icon="leave"
              label="Leave space"
              onClick={() => onLeaveRoom(activeChat.id)}
            />
          ) : null}
          {activeChat.kind === "dialog" && currentDialog?.is_frozen ? (
            <span className="warning-chip">Messaging frozen</span>
          ) : null}
        </div>
      </header>

      <MessageHistory
        activeChat={activeChat}
        activeRoom={activeRoom}
        editingMessageId={editingMessageId}
        editingText={editingText}
        loadingOlder={loadingOlder}
        messageCursor={messageCursor}
        messages={messages}
        messagesLoading={messagesLoading}
        onDeleteMessage={onDeleteMessage}
        onLoadOlder={onLoadOlder}
        onSaveEdit={onSaveEdit}
        onSetEditingMessageId={onSetEditingMessageId}
        onSetEditingText={onSetEditingText}
        onSetReplyTarget={onSetReplyTarget}
        profile={profile}
        stickToBottomRef={stickToBottomRef}
        viewportRef={viewportRef}
      />

      <MessageComposer
        activeChat={activeChat}
        attachmentComment={attachmentComment}
        busy={busy}
        composerText={composerText}
        currentDialog={currentDialog}
        onClearReplyTarget={onClearReplyTarget}
        onFileSelection={onFileSelection}
        onRemoveQueuedAttachment={onRemoveQueuedAttachment}
        onSetAttachmentComment={onSetAttachmentComment}
        onSetComposerText={onSetComposerText}
        onSubmit={onComposerSubmit}
        queuedAttachments={queuedAttachments}
        replyTarget={replyTarget}
      />
    </>
  );
}
