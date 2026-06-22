import { type CSSProperties, useRef } from "react";

import { Detail } from "@/panel/components/detail";
import { Navigator } from "@/panel/components/navigation";
import { ResizeHandle } from "@/panel/components/resize";
import { StatusBar } from "@/panel/components/status";
import { Timeline, TimelineCount } from "@/panel/components/timeline";
import { useLayout } from "@/panel/hooks/use-layout";
import { usePanelState } from "@/panel/hooks/use-panel-state";

/**
 * The inspector panel: master–detail (Navigator + Detail) over a collapsible, cross-linked Timeline.
 */
export function Panel() {
  const { state, actions } = usePanelState();
  const { layout, actions: layoutActions } = useLayout();

  const columnRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={columnRef}
      className={"flex h-screen flex-col bg-surface font-mono text-xs text-fg"}
      style={{ "--timeline-h": `${(layout.timelineFraction * 100).toFixed(3)}%` } as CSSProperties}
    >
      <StatusBar />

      <div
        ref={rowRef}
        className={"flex min-h-0 flex-1"}
        style={{ "--nav-w": `${(layout.navFraction * 100).toFixed(3)}%` } as CSSProperties}
      >
        <div className={"min-w-55 overflow-hidden"} style={{ flex: "0 0 var(--nav-w)" }}>
          <Navigator selection={state.selection} collapsed={state.ui.collapsed} actions={actions} />
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

        <Detail selection={state.selection} actions={actions} />
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
          {layout.timelineOpen ? "▾" : "▸"} Timeline <TimelineCount filter={state.filter} />
        </button>

        {layout.timelineOpen ? (
          <div className={"min-h-0 flex-1"}>
            <Timeline filter={state.filter} ui={state.ui} actions={actions} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
