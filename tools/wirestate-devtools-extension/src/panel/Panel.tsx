import { type DevtoolsEvent, type DevtoolsMessageResultEvent } from "@wirestate/core/devtools";
import { type CSSProperties, useMemo, useRef } from "react";

import { Detail } from "@/panel/components/detail/Detail";
import { Navigator } from "@/panel/components/Navigator";
import { ResizeHandle } from "@/panel/components/ResizeHandle";
import { StatusBar } from "@/panel/components/StatusBar";
import { Timeline } from "@/panel/components/timeline/Timeline";
import { type RootModel, buildRoots, filterLog } from "@/panel/selectors";
import { useBridge } from "@/panel/use-bridge";
import { useLayout } from "@/panel/use-layout";
import { usePanelState } from "@/panel/use-panel-state";

/** The inspector panel: master–detail (Navigator + Detail) over a collapsible, cross-linked Timeline. */
export function Panel() {
  const { connected, protocolVersion, roots, log, clear, inspect } = useBridge();
  const { state, actions } = usePanelState();
  const { layout, actions: layoutActions } = useLayout();

  // Resizable splits write their live fraction straight to these containers' CSS vars during a drag
  // (see ResizeHandle), so dragging never re-renders the panel.
  const columnRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const builtRoots: ReadonlyArray<RootModel> = useMemo(() => buildRoots(roots), [roots]);
  const containerIds: ReadonlyArray<number> = useMemo(
    () => roots.flatMap((root) => root.containers.map((container) => container.containerId)),
    [roots]
  );
  const filtered: ReadonlyArray<DevtoolsEvent> = useMemo(() => filterLog(log, state.filter), [log, state.filter]);
  const messageResults: ReadonlyMap<number, DevtoolsMessageResultEvent> = useMemo(() => {
    const map: Map<number, DevtoolsMessageResultEvent> = new Map();

    for (const event of log) {
      if (event.kind === "messageResult") {
        map.set(event.messageId, event);
      }
    }

    return map;
  }, [log]);
  const containerCount: number = roots.reduce((total, root) => total + root.containers.length, 0);

  return (
    <div
      ref={columnRef}
      className={"flex h-screen flex-col bg-surface font-mono text-xs text-fg"}
      style={{ "--timeline-h": `${(layout.timelineFraction * 100).toFixed(3)}%` } as CSSProperties}
    >
      <StatusBar
        connected={connected}
        protocolVersion={protocolVersion}
        rootCount={roots.length}
        containerCount={containerCount}
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
          {layout.timelineOpen ? "▾" : "▸"} Timeline <span className={"text-fg-subtle"}>({filtered.length})</span>
        </button>

        {layout.timelineOpen ? (
          <div className={"min-h-0 flex-1"}>
            <Timeline
              events={filtered}
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
