export type IconName =
  | "leave"
  | "reply"
  | "edit"
  | "delete"
  | "save"
  | "cancel"
  | "clear"
  | "attach"
  | "send"
  | "promote"
  | "demote"
  | "remove"
  | "ban"
  | "unban"
  | "invite"
  | "friend-remove"
  | "peer-ban"
  | "peer-unban";

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
};

export function Icon({ name }: { name: IconName }) {
  switch (name) {
    case "leave":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...common} d="M10 17l-5-5 5-5" />
          <path {...common} d="M5 12h10" />
          <path {...common} d="M14 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" />
        </svg>
      );
    case "reply":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...common} d="M10 9l-5 4 5 4" />
          <path {...common} d="M5 13h8a6 6 0 0 1 6 6" />
          <path {...common} d="M13 7a6 6 0 0 1 6 6" />
        </svg>
      );
    case "edit":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...common} d="M4 20h4l10-10-4-4L4 16v4z" />
          <path {...common} d="M12 6l4 4" />
        </svg>
      );
    case "delete":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...common} d="M4 7h16" />
          <path {...common} d="M9 7V4h6v3" />
          <path {...common} d="M7 7l1 13h8l1-13" />
          <path {...common} d="M10 11v5M14 11v5" />
        </svg>
      );
    case "save":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...common} d="M5 4h11l3 3v13H5z" />
          <path {...common} d="M8 4v6h8V4" />
          <path {...common} d="M9 18h6" />
        </svg>
      );
    case "cancel":
    case "clear":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...common} d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "attach":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...common} d="M8 12.5l6.4-6.4a3.5 3.5 0 1 1 5 5L10 20.5a5 5 0 0 1-7-7L12 4.5" />
        </svg>
      );
    case "send":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...common} d="M4 20l16-8L4 4l3 8-3 8z" />
          <path {...common} d="M7 12h13" />
        </svg>
      );
    case "promote":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...common} d="M12 18V7" />
          <path {...common} d="M8.5 10.5L12 7l3.5 3.5" />
          <path {...common} d="M5 20h14" />
        </svg>
      );
    case "demote":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path {...common} d="M12 6v11" />
          <path {...common} d="M8.5 13.5L12 17l3.5-3.5" />
          <path {...common} d="M5 20h14" />
        </svg>
      );
    case "remove":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle {...common} cx="9" cy="8" r="3" />
          <path {...common} d="M4 19a5 5 0 0 1 10 0" />
          <path {...common} d="M16 11h5" />
        </svg>
      );
    case "ban":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle {...common} cx="12" cy="12" r="8" />
          <path {...common} d="M8.5 8.5l7 7" />
        </svg>
      );
    case "unban":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle {...common} cx="12" cy="12" r="8" />
          <path {...common} d="M8.5 12h7" />
        </svg>
      );
    case "invite":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle {...common} cx="9" cy="8" r="3" />
          <path {...common} d="M4 19a5 5 0 0 1 10 0" />
          <path {...common} d="M18 8v6M15 11h6" />
        </svg>
      );
    case "friend-remove":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle {...common} cx="9" cy="8" r="3" />
          <path {...common} d="M4 19a5 5 0 0 1 10 0" />
          <path {...common} d="M16 8l4 4M20 8l-4 4" />
        </svg>
      );
    case "peer-ban":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle {...common} cx="9" cy="8" r="3" />
          <path {...common} d="M4 19a5 5 0 0 1 10 0" />
          <circle {...common} cx="18" cy="10" r="3" />
          <path {...common} d="M16 8l4 4" />
        </svg>
      );
    case "peer-unban":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle {...common} cx="9" cy="8" r="3" />
          <path {...common} d="M4 19a5 5 0 0 1 10 0" />
          <path {...common} d="M15 10h6" />
        </svg>
      );
  }
}

export function IconButton(props: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "default" | "positive" | "danger";
}) {
  const variantClass =
    props.variant === "positive" ? "positive" : props.variant === "danger" ? "danger" : "";

  return (
    <button
      aria-label={props.label}
      className={`icon-button ${variantClass}`.trim()}
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.label}
      type={props.type ?? "button"}
    >
      <Icon name={props.icon} />
      <span className="sr-only">{props.label}</span>
    </button>
  );
}
