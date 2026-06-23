import { type DevtoolsEvent } from "@wirestate/core/devtools";

import { EventSummary } from "@/panel/components/EventSummary";
import { EventTimeCells } from "@/panel/components/EventTimeCells";
import { timestampOfDevtoolsEvent } from "@/panel/lib/format";
import { type Optional } from "@/types/general";

interface DetailHistoryProps {
  readonly events: ReadonlyArray<DevtoolsEvent>;
  /**
   * Navigates to the binding that realizes the instance a lifecycle row is about (by container + token).
   */
  readonly onSelectBinding: (containerId: number, token: string) => void;
}

/**
 * Renders a derived lifecycle history: each delta with its clock time, offset from the first, and subject.
 */
export function DetailHistory({ events, onSelectBinding }: DetailHistoryProps) {
  if (events.length === 0) {
    return <span className={"text-fg-muted"}>no recorded lifecycle (buffer may have rolled over)</span>;
  }

  // Relative offsets are measured from the first event currently shown.
  const baseline: Optional<number> = timestampOfDevtoolsEvent(events[0]);

  return (
    <ol className={"space-y-0.5"}>
      {events.map((event, index) => (
        <li key={index} className={"flex gap-2 text-fg"}>
          <EventTimeCells event={event} baseline={baseline} />

          <span className={"flex-1"}>
            <EventSummary event={event} onSelectBinding={onSelectBinding} />
          </span>
        </li>
      ))}
    </ol>
  );
}
