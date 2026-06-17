import type { DevtoolsEvent } from "@wirestate/core/devtools";
import { useEffect, useRef } from "react";

import { summarize } from "@/panel/format";
import type { RootModel } from "@/panel/selectors";
import type { TimelineFilter } from "@/panel/types";
import type { PanelActions, PanelUi } from "@/panel/use-panel-state";

import { TimelineFilters } from "./TimelineFilters";
import { TimelineRow } from "./TimelineRow";

interface TimelineProps {
  /** Already filtered deltas (Panel applies the filter). */
  readonly events: ReadonlyArray<DevtoolsEvent>;
  readonly roots: ReadonlyArray<RootModel>;
  readonly containerIds: ReadonlyArray<number>;
  readonly filter: TimelineFilter;
  readonly ui: PanelUi;
  readonly actions: PanelActions;
  readonly onClear: () => void;
}

interface CollapsedRow {
  event: DevtoolsEvent;
  count: number;
}

/** Timeline dock body: filter bar + the (frozen-on-pause, dedup-collapsed, autoscrolled) delta list. */
export function Timeline({ events, roots, containerIds, filter, ui, actions, onClear }: TimelineProps) {
  const frozen = useRef<ReadonlyArray<DevtoolsEvent>>(events);

  if (!ui.paused) {
    frozen.current = events;
  }

  const shown: ReadonlyArray<DevtoolsEvent> = ui.paused ? frozen.current : events;
  const rows: ReadonlyArray<CollapsedRow> = collapse(shown);

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
        onClear={onClear}
      />
      <div ref={scrollRef} className={"flex-1 overflow-auto"}>
        {rows.length === 0 ? (
          <p className={"p-2 text-neutral-500 dark:text-neutral-400"}>
            No deltas match the current filter — interact with the page.
          </p>
        ) : (
          rows.map((row, index) => <TimelineRow key={index} event={row.event} count={row.count} actions={actions} />)
        )}
      </div>
    </div>
  );
}

/** Collapses consecutive identical deltas into one row with a count. */
function collapse(events: ReadonlyArray<DevtoolsEvent>): ReadonlyArray<CollapsedRow> {
  const rows: Array<CollapsedRow> = [];

  for (const event of events) {
    const last: CollapsedRow | undefined = rows[rows.length - 1];

    if (last && summarize(last.event) === summarize(event)) {
      last.count += 1;
    } else {
      rows.push({ event, count: 1 });
    }
  }

  return rows;
}
