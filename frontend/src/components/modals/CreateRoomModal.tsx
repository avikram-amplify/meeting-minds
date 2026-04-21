import type { FormEvent } from "react";
import type { RoomDetail } from "../../types";
import { Modal } from "../Modal";

interface CreateRoomModalProps {
  newRoomName: string;
  newRoomDescription: string;
  newRoomVisibility: RoomDetail["visibility"];
  onSetName: (v: string) => void;
  onSetDescription: (v: string) => void;
  onSetVisibility: (v: RoomDetail["visibility"]) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function CreateRoomModal({
  newRoomName,
  newRoomDescription,
  newRoomVisibility,
  onSetName,
  onSetDescription,
  onSetVisibility,
  onSubmit,
  onClose,
}: CreateRoomModalProps) {
  return (
    <Modal onClose={onClose} title="Create Space">
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Space name
          <input onChange={(e) => onSetName(e.target.value)} required value={newRoomName} />
        </label>
        <label>
          Description
          <textarea
            onChange={(e) => onSetDescription(e.target.value)}
            rows={3}
            value={newRoomDescription}
          />
        </label>
        <label>
          Visibility
          <select
            onChange={(e) => onSetVisibility(e.target.value as RoomDetail["visibility"])}
            value={newRoomVisibility}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <button className="primary-button" type="submit">
          Create Space
        </button>
      </form>
    </Modal>
  );
}
