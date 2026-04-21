export type AuthMode = "login" | "register" | "reset";
export type ShellStatus = "booting" | "guest" | "ready";
export type ConnectionState = "connecting" | "open" | "closed";
export type SidebarTab = "rooms" | "people";
export type ToastTone = "info" | "error";

export interface ToastState {
  tone: ToastTone;
  message: string;
}

export interface QueuedAttachment {
  id: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  comment: string | null;
}
