interface TimelineToggleProps {
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
}

/**
 * A small on/off pill button used in the Timeline's control bar.
 */
export function TimelineToggle({ active, label, onClick }: TimelineToggleProps) {
  return (
    <button
      className={`rounded border px-2 py-0.5 ${
        active ? "border-emerald-400 text-emerald-600 dark:text-emerald-400" : "border-divider text-fg-muted"
      }`}
      type={"button"}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
