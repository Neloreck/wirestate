import { type PointerEvent as ReactPointerEvent, type RefObject, useRef, useState } from "react";

import { type Nullable } from "@/types/general";

interface ResizeHandleProps {
  /** Resize axis: "x" drags left/right (a vertical divider); "y" drags up/down (a horizontal divider). */
  readonly orientation: "x" | "y";
  /** Which side of the handle carries the `cssVar` flex-basis — the pane whose fraction we control. */
  readonly controls: "start" | "end";
  /** The flex container to measure and write the CSS variable on (drag is relative to its box). */
  readonly containerRef: RefObject<Nullable<HTMLDivElement>>;
  /** Custom property the controlled pane reads as its flex-basis, e.g. "--nav-w". */
  readonly cssVar: string;
  /** Minimum pixel size of the start (top/left) pane — floors the drag so neither pane starves. */
  readonly minStartPx: number;
  /** Minimum pixel size of the end (bottom/right) pane. */
  readonly minEndPx: number;
  /** Called once on release with the committed fraction (0–1) of the controlled pane. */
  readonly onCommit: (fraction: number) => void;
}

/**
 * A draggable divider between two flex panes. During the drag it writes the live fraction straight to
 * the container's CSS variable through a ref — no React state per move, so the inspector's render path
 * (which re-runs on every devtools event) is untouched. State is the source of truth at rest: on
 * release it commits the final fraction via `onCommit`, and the next render re-applies the same value.
 */
export function ResizeHandle({
  orientation,
  controls,
  containerRef,
  cssVar,
  minStartPx,
  minEndPx,
  onCommit,
}: ResizeHandleProps) {
  const [dragging, setDragging] = useState<boolean>(false);
  // Synchronous drag guard: `pointermove` also fires on hover, and the `dragging` state lags one
  // render behind `pointerdown`, so the live gate is a ref (the state is only for the visual).
  const active = useRef<boolean>(false);
  const last = useRef<Nullable<number>>(null);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    active.current = true;
    last.current = null;
    setDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = orientation === "x" ? "col-resize" : "row-resize";
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!active.current) {
      return;
    }

    const container: Nullable<HTMLDivElement> = containerRef.current;

    if (!container) {
      return;
    }

    const rect: DOMRect = container.getBoundingClientRect();
    const size: number = orientation === "x" ? rect.width : rect.height;

    if (size <= 0) {
      return;
    }

    const offset: number = orientation === "x" ? event.clientX - rect.left : event.clientY - rect.top;
    const startFraction: number = offset / size;
    const controlled: number = controls === "start" ? startFraction : 1 - startFraction;

    const minControlled: number = (controls === "start" ? minStartPx : minEndPx) / size;
    const maxControlled: number = 1 - (controls === "start" ? minEndPx : minStartPx) / size;
    const clamped: number = Math.min(Math.max(controlled, minControlled), Math.max(minControlled, maxControlled));

    container.style.setProperty(cssVar, `${(clamped * 100).toFixed(3)}%`);
    last.current = clamped;
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    active.current = false;
    setDragging(false);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";

    if (last.current !== null) {
      onCommit(last.current);
    }
  }

  const strip: string =
    orientation === "x" ? "w-[5px] cursor-col-resize self-stretch" : "h-[5px] cursor-row-resize w-full";
  const line: string =
    orientation === "x"
      ? "absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
      : "absolute inset-x-0 top-1/2 h-px -translate-y-1/2";
  const lineColor: string = dragging ? "bg-fg-subtle" : "bg-divider group-hover:bg-fg-subtle";

  return (
    <div
      role={"separator"}
      aria-orientation={orientation === "x" ? "vertical" : "horizontal"}
      className={`group relative flex-none ${strip}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <span className={`${line} ${lineColor}`} />
    </div>
  );
}
