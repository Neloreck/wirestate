import { type DevtoolsEvent, type DevtoolsMessageResultEvent } from "@wirestate/core/devtools";
import { useInjection } from "@wirestate/react";
import { observer } from "@wirestate/react-mobx";
import { useEffect, useMemo, useRef } from "react";

import { type PanelActions, type PanelUi } from "@/panel/hooks/use-panel-state";
import { getDevtoolsEventSummary, timestampOfDevtoolsEvent } from "@/panel/lib/format";
import { type RootModel, buildMessageResults, buildRoots, filterLogBy } from "@/panel/lib/selectors";
import { type TimelineFilter } from "@/panel/lib/types";
import { BridgeService } from "@/panel/services/bridge.service";
import { type Optional } from "@/types/general";

import { TimelineFilters } from "./TimelineFilters";
import { TimelineRow } from "./TimelineRow";

interface TimelineProps {
  readonly filter: TimelineFilter;
  readonly ui: PanelUi;
  readonly actions: PanelActions;
}

/**
 * Timeline dock body: filter bar + the (frozen-on-pause, dedup-collapsed, autoscrolled) delta list.
 */
export const Timeline = observer(function Timeline({ filter, ui, actions }: TimelineProps) {
  const bridge: BridgeService = useInjection(BridgeService);
  const roots: ReadonlyArray<RootModel> = useMemo(() => buildRoots(bridge.roots), [bridge.roots]);
  const containerIds: ReadonlyArray<number> = useMemo(
    () => bridge.roots.flatMap((root) => root.containers.map((container) => container.containerId)),
    [bridge.roots]
  );
  const events: ReadonlyArray<DevtoolsEvent> = useMemo(() => filterLogBy(bridge.log, filter), [bridge.log, filter]);
  const results: ReadonlyMap<number, DevtoolsMessageResultEvent> = useMemo(
    () => buildMessageResults(bridge.log),
    [bridge.log]
  );

  const frozen = useRef<ReadonlyArray<DevtoolsEvent>>(events);

  if (!ui.paused) {
    frozen.current = events;
  }

  const shown: ReadonlyArray<DevtoolsEvent> = ui.paused ? frozen.current : events;
  const rows: ReadonlyArray<CollapsedRow> = timelineCollapse(shown);
  // Relative offsets are measured from the first row currently shown (resets with the filter/pause).
  const baseline: Optional<number> = rows.length > 0 ? timestampOfDevtoolsEvent(rows[0].event) : undefined;

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ui.autoscroll && !ui.paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rows.length, ui.autoscroll, ui.paused]);

  return (
    <div className={"flex h-full flex-col"}>
      <TimelineFilters
        roots={roots}
        containerIds={containerIds}
        filter={filter}
        ui={ui}
        actions={actions}
        onClear={() => bridge.clear()}
      />
      <div ref={scrollRef} className={"flex-1 overflow-auto"}>
        {rows.length === 0 ? (
          <p className={"p-2 text-fg-muted"}>No deltas match the current filter — interact with the page.</p>
        ) : (
          rows.map((row, index) => (
            <TimelineRow
              key={index}
              event={row.event}
              count={row.count}
              actions={actions}
              baseline={baseline}
              result={row.event.kind === "message" ? results.get(row.event.message.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
});

interface CollapsedRow {
  event: DevtoolsEvent;
  count: number;
}

/**
 * Collapses consecutive identical deltas into one row with a count.
 */
function timelineCollapse(events: ReadonlyArray<DevtoolsEvent>): ReadonlyArray<CollapsedRow> {
  const rows: Array<CollapsedRow> = [];

  for (const event of events) {
    const last: CollapsedRow | undefined = rows[rows.length - 1];

    if (last && getDevtoolsEventSummary(last.event) === getDevtoolsEventSummary(event)) {
      last.count += 1;
    } else {
      rows.push({ event, count: 1 });
    }
  }

  return rows;
}
