import { type DevtoolsEvent } from "@wirestate/core/devtools";

import { formatTimestamp, formatDelta, timestampOf } from "@/panel/lib/format";
import { type Optional } from "@/types/general";

interface EventTimeCellsProps {
  readonly event: DevtoolsEvent;

  /**
   * Timestamp of the first row shown, for the relative offset; `undefined` disables the Δ column.
   */
  readonly baseline: Optional<number>;
}

/**
 * The clock-time + relative-offset (Δ) columns shared by the Timeline rows and the lifecycle History.
 */
export function EventTimeCells({ event, baseline }: EventTimeCellsProps) {
  const timestamp: Optional<number> = timestampOf(event);
  const delta: Optional<number> = timestamp !== undefined && baseline !== undefined ? timestamp - baseline : undefined;

  return (
    <>
      <span className={"w-22 shrink-0 text-fg-subtle tabular-nums"}>
        {timestamp === undefined ? "" : formatTimestamp(timestamp)}
      </span>

      <span className={"w-14 shrink-0 text-fg-muted tabular-nums"}>
        {delta === undefined ? "" : formatDelta(delta)}
      </span>
    </>
  );
}
