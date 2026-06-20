import { type DevtoolsEvent, type DevtoolsMessageResultEvent } from "@wirestate/core/devtools";
import { type CSSProperties, useMemo, useRef } from "react";

import { Detail } from "@/panel/components/detail";
import { Navigator } from "@/panel/components/navigation";
import { ResizeHandle } from "@/panel/components/resize";
import { StatusBar } from "@/panel/components/status";
import { Timeline } from "@/panel/components/timeline";
import { useBridge } from "@/panel/hooks/use-bridge";
import { useLayout } from "@/panel/hooks/use-layout";
import { usePanelState } from "@/panel/hooks/use-panel-state";
import { type RootModel, buildMessageResults, buildRoots, filterLog } from "@/panel/lib/selectors";

/**
 * The inspector panel: master–detail (Navigator + Detail) over a collapsible, cross-linked Timeline.
 */
export function Panel() {
  const { connected, protocolVersion, roots, log, clear, inspect } = useBridge();
  const { state, actions } = usePanelState();
  const { layout, actions: layoutActions } = useLayout();

  const columnRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const containerCount: number = roots.reduce((total, root) => total + root.containers.length, 0);
  const containerIds: ReadonlyArray<number> = useMemo(
    () => roots.flatMap((root) => root.containers.map((container) => container.containerId)),
    [roots]
  );

  const builtRoots: ReadonlyArray<RootModel> = useMemo(() => buildRoots(roots), [roots]);
  const filteredLogs: ReadonlyArray<DevtoolsEvent> = useMemo(() => filterLog(log, state.filter), [log, state.filter]);
  const messageResults: ReadonlyMap<number, DevtoolsMessageResultEvent> = useMemo(
    () => buildMessageResults(log),
    [log]
  );

  return (
    <div
      ref={columnRef}
      className={"flex h-screen flex-col bg-surface font-mono text-xs text-fg"}
      style={{ "--timeline-h": `${(layout.timelineFraction * 100).toFixed(3)}%` } as CSSProperties}
    >
      <StatusBar
        isConnected={connected}
        protocolVersion={protocolVersion}
        rootsCount={roots.length}
        containersCount={containerCount}
      />

      <div
        ref={rowRef}
        className={"flex min-h-0 flex-1"}
        style={{ "--nav-w": `${(layout.navFraction * 100).toFixed(3)}%` } as CSSProperties}
      >
        <div className={"min-w-[220px] overflow-hidden"} style={{ flex: "0 0 var(--nav-w)" }}>
          <Navigator roots={builtRoots} selection={state.selection} collapsed={state.ui.collapsed} actions={actions} />
        </div>

        <ResizeHandle
          orientation={"x"}
          controls={"start"}
          containerRef={rowRef}
          cssVar={"--nav-w"}
          minStartPx={220}
          minEndPx={240}
          onCommit={layoutActions.setNavFraction}
        />

        <Detail roots={roots} log={log} selection={state.selection} actions={actions} inspect={inspect} />
      </div>

      {layout.timelineOpen ? (
        <ResizeHandle
          orientation={"y"}
          controls={"end"}
          containerRef={columnRef}
          cssVar={"--timeline-h"}
          minStartPx={150}
          minEndPx={80}
          onCommit={layoutActions.setTimelineFraction}
        />
      ) : null}

      <div
        className={`flex min-h-0 flex-col ${layout.timelineOpen ? "" : "border-t border-divider"}`}
        style={layout.timelineOpen ? { flex: "0 0 var(--timeline-h)" } : undefined}
      >
        <button
          type={"button"}
          onClick={layoutActions.toggleTimeline}
          className={"flex items-center gap-1 bg-elevated px-2.5 py-0.5 text-left text-fg-muted"}
        >
          {layout.timelineOpen ? "▾" : "▸"} Timeline <span className={"text-fg-subtle"}>({filteredLogs.length})</span>
        </button>

        {layout.timelineOpen ? (
          <div className={"min-h-0 flex-1"}>
            <Timeline
              events={filteredLogs}
              roots={builtRoots}
              containerIds={containerIds}
              filter={state.filter}
              ui={state.ui}
              actions={actions}
              onClear={clear}
              results={messageResults}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
