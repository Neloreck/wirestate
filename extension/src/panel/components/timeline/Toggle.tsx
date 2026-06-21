interface ToggleProps {
  readonly on: boolean;
  readonly label: string;
  readonly onClick: () => void;
}

/** A small on/off pill button used in the Timeline's control bar. */
export function Toggle({ on, label, onClick }: ToggleProps) {
  return (
    <button
      type={"button"}
      onClick={onClick}
      className={`rounded border px-2 py-0.5 ${
        on ? "border-emerald-400 text-emerald-600 dark:text-emerald-400" : "border-divider text-fg-muted"
      }`}
    >
      {label}
    </button>
  );
}
