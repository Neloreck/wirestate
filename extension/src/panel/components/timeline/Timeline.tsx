import { type DevtoolsEvent, type DevtoolsMessageResultEvent } from "@wirestate/core/devtools";
import { useInjection } from "@wirestate/react";
import { observer } from "@wirestate/react-mobx";
import { useEffect, useMemo, useRef } from "react";

import { type PanelActions, type PanelUi, type TimelineFilter } from "@/panel/hooks/use-panel-state";
import { timestampOfDevtoolsEvent } from "@/panel/lib/format";
import {
  type CollapsedRow,
  type RootModel,
  buildMessageResults,
  buildRoots,
  collapseTimeline,
  filterLogBy,
} from "@/panel/lib/selectors";
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
  const bridgeService: BridgeService = useInjection(BridgeService);

  const roots: ReadonlyArray<RootModel> = useMemo(() => buildRoots(bridgeService.roots), [bridgeService.roots]);
  const containerIds: ReadonlyArray<number> = useMemo(
    () => bridgeService.roots.flatMap((root) => root.containers.map((container) => container.containerId)),
    [bridgeService.roots]
  );
  const events: ReadonlyArray<DevtoolsEvent> = useMemo(
    () => filterLogBy(bridgeService.log, filter),
    [bridgeService.log, filter]
  );
  const results: ReadonlyMap<number, DevtoolsMessageResultEvent> = useMemo(
    () => buildMessageResults(bridgeService.log),
    [bridgeService.log]
  );

  const frozen = useRef<ReadonlyArray<DevtoolsEvent>>(events);

  if (!ui.paused) {
    frozen.current = events;
  }

  const shown: ReadonlyArray<DevtoolsEvent> = ui.paused ? frozen.current : events;
  const rows: ReadonlyArray<CollapsedRow> = useMemo(() => collapseTimeline(shown), [shown]);
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
        onClear={bridgeService.clear}
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
