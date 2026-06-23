import { type CSSProperties, useMemo, useRef } from "react";

import { Detail } from "@/panel/components/detail";
import { Navigation } from "@/panel/components/navigation";
import { ResizeHandle } from "@/panel/components/resize";
import { StatusBar } from "@/panel/components/status";
import { Timeline, TimelineCount } from "@/panel/components/timeline";
import { useLayout } from "@/panel/hooks/use-layout";
import { usePanelState } from "@/panel/hooks/use-panel-state";

export const NAV_WIDTH_VAR: string = "--nav-w";
export const TIMELINE_HEIGHT_VAR: string = "--timeline-h";

/**
 * The inspector panel: master–detail (Navigator + Detail) over a collapsible, cross-linked Timeline.
 */
export function Panel() {
  const { state, actions } = usePanelState();
  const { layout, actions: layoutActions } = useLayout();

  const columnRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const styles = useMemo(
    () => ({
      column: { [TIMELINE_HEIGHT_VAR]: `${(layout.timelineFraction * 100).toFixed(3)}%` } as CSSProperties,
      row: { [NAV_WIDTH_VAR]: `${(layout.navFraction * 100).toFixed(3)}%` } as CSSProperties,
      navigation: { flex: `0 0 var(${NAV_WIDTH_VAR})` } as CSSProperties,
      timeline: { flex: `0 0 var(${TIMELINE_HEIGHT_VAR})` } as CSSProperties,
    }),
    [layout.navFraction, layout.timelineFraction]
  );

  return (
    <div
      ref={columnRef}
      className={"flex h-screen flex-col bg-surface font-mono text-xs text-fg"}
      style={styles.column}
    >
      <StatusBar />

      <div ref={rowRef} className={"flex min-h-0 flex-1"} style={styles.row}>
        <div className={"min-w-55 overflow-hidden"} style={styles.navigation}>
          <Navigation selection={state.selection} collapsed={state.ui.collapsed} actions={actions} />
        </div>

        <ResizeHandle
          orientation={"x"}
          controls={"start"}
          containerRef={rowRef}
          cssVar={NAV_WIDTH_VAR}
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
          cssVar={TIMELINE_HEIGHT_VAR}
          minStartPx={150}
          minEndPx={80}
          onCommit={layoutActions.setTimelineFraction}
        />
      ) : null}

      <div
        className={`flex min-h-0 flex-col ${layout.timelineOpen ? "" : "border-t border-divider"}`}
        style={layout.timelineOpen ? styles.timeline : undefined}
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
