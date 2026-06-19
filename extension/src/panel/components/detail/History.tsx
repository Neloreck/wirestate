import { type DevtoolsEvent } from "@wirestate/core/devtools";

import { EventSummary } from "@/panel/components/EventSummary";
import { formatClock, formatDelta, timestampOf } from "@/panel/utils/format";
import { type Optional } from "@/types/general";

interface HistoryProps {
  readonly events: ReadonlyArray<DevtoolsEvent>;
  /** Navigates to the instance a lifecycle row is about (by container + class). */
  readonly onSelectInstance: (containerId: number, className: string) => void;
}

/** Renders a derived lifecycle history: each delta with its clock time, offset from the first, and subject. */
export function History({ events, onSelectInstance }: HistoryProps) {
  if (events.length === 0) {
    return <span className={"text-fg-muted"}>no recorded lifecycle (buffer may have rolled over)</span>;
  }

  // Relative offsets are measured from the first event currently shown.
  const baseline: Optional<number> = timestampOf(events[0]);

  return (
    <ol className={"space-y-0.5"}>
      {events.map((event, index) => {
        const timestamp: Optional<number> = timestampOf(event);
        const delta: Optional<number> =
          timestamp !== undefined && baseline !== undefined ? timestamp - baseline : undefined;

        return (
          <li key={index} className={"flex gap-2 text-fg"}>
            <span className={"w-[88px] shrink-0 text-fg-subtle tabular-nums"}>
              {timestamp === undefined ? "" : formatClock(timestamp)}
            </span>
            <span className={"w-[56px] shrink-0 text-fg-muted tabular-nums"}>
              {delta === undefined ? "" : formatDelta(delta)}
            </span>
            <span className={"flex-1"}>
              <EventSummary event={event} onSelectInstance={onSelectInstance} />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
