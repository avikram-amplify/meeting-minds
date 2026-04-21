import type { ToastTone } from "../types/app";

export function Toast({ tone, message }: { tone: ToastTone; message: string }) {
  return <div className={`toast toast-${tone}`}>{message}</div>;
}
