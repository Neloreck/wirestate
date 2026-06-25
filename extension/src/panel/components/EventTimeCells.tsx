import { type DevtoolsEvent } from "#/devtools";

import { formatTimestamp, formatDelta, timestampOfDevtoolsEvent } from "@/panel/lib/format";
import { type Maybe, type Optional } from "@/types/general";

interface EventTimeCellsProps {
  readonly event: DevtoolsEvent;
  readonly baseline: Optional<number>;
}

/**
 * The clock-time + relative-offset columns shared by the Timeline rows and the lifecycle History.
 */
export function EventTimeCells({ event, baseline }: EventTimeCellsProps) {
  const timestamp: Maybe<number> = timestampOfDevtoolsEvent(event);
  const delta: Maybe<number> =
    typeof timestamp === "number" && typeof baseline === "number" ? timestamp - baseline : null;

  return (
    <>
      <span className={"w-22 shrink-0 text-fg-subtle tabular-nums"}>
        {typeof timestamp === "number" ? formatTimestamp(timestamp) : ""}
      </span>

      <span className={"w-14 shrink-0 text-fg-muted tabular-nums"}>
        {typeof delta === "number" ? formatDelta(delta) : ""}
      </span>
    </>
  );
}
