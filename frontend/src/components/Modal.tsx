import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-label={title} aria-modal="true" className="modal-card" role="dialog">
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="ghost-button" onClick={onClose}>
            Close
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
