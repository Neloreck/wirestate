import type { DevtoolsEvent } from "@wirestate/core/devtools";
import { useMemo, useState } from "react";

import { Navigator } from "@/panel/components/Navigator";
import { StatusBar } from "@/panel/components/StatusBar";
import { Detail } from "@/panel/components/detail/Detail";
import { Timeline } from "@/panel/components/timeline/Timeline";
import { type RootModel, buildRoots, filterLog } from "@/panel/selectors";
import { useBridge } from "@/panel/use-bridge";
import { usePanelState } from "@/panel/use-panel-state";

/** The inspector panel: master–detail (Navigator + Detail) over a collapsible, cross-linked Timeline. */
export function Panel() {
  const { connected, protocolVersion, roots, log, clear } = useBridge();
  const { state, actions } = usePanelState();
  const [timelineOpen, setTimelineOpen] = useState(true);

  const builtRoots: ReadonlyArray<RootModel> = useMemo(() => buildRoots(roots), [roots]);
  const containerIds: ReadonlyArray<number> = useMemo(
    () => roots.flatMap((root) => root.containers.map((container) => container.containerId)),
    [roots],
  );
  const filtered: ReadonlyArray<DevtoolsEvent> = useMemo(() => filterLog(log, state.filter), [log, state.filter]);
  const containerCount: number = roots.reduce((total, root) => total + root.containers.length, 0);

  return (
    <div className="flex h-screen flex-col bg-white font-mono text-xs text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
      <StatusBar
        connected={connected}
        protocolVersion={protocolVersion}
        rootCount={roots.length}
        containerCount={containerCount}
      />

      <div className="flex min-h-0 flex-1">
        <Navigator roots={builtRoots} selection={state.selection} collapsed={state.ui.collapsed} actions={actions} />
        <Detail roots={roots} log={log} selection={state.selection} actions={actions} />
      </div>

      <div className={`flex flex-col border-t border-neutral-200 dark:border-neutral-700 ${timelineOpen ? "h-2/5" : ""}`}>
        <button
          type="button"
          onClick={() => setTimelineOpen((open) => !open)}
          className="flex items-center gap-1 bg-neutral-100 px-2.5 py-0.5 text-left text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
        >
          {timelineOpen ? "▾" : "▸"} Timeline <span className="text-neutral-400">({filtered.length})</span>
        </button>

        {timelineOpen ? (
          <div className="min-h-0 flex-1">
            <Timeline
              events={filtered}
              roots={builtRoots}
              containerIds={containerIds}
              filter={state.filter}
              ui={state.ui}
              actions={actions}
              onClear={clear}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
