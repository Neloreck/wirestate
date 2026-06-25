import { cn } from "@/lib/class-name";

interface TimelineToggleProps {
  readonly active: boolean;
  readonly dot?: boolean;
  readonly label: string;
  readonly onClick: () => void;
}

export function TimelineToggle({ active, label, onClick, dot = false }: TimelineToggleProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5",
        active ? "border-emerald-400 text-emerald-600 dark:text-emerald-400" : "border-divider text-fg-muted"
      )}
      type={"button"}
      onClick={onClick}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-amber-500")} /> : null}

      {label}
    </button>
  );
}
