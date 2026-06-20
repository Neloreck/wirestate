import { type PointerEvent as ReactPointerEvent, type RefObject, useRef, useState } from "react";

import { type Nullable } from "@/types/general";

interface ResizeHandleProps {
  readonly orientation: "x" | "y";
  readonly controls: "start" | "end";
  readonly containerRef: RefObject<Nullable<HTMLDivElement>>;
  readonly cssVar: string;
  readonly minStartPx: number;
  readonly minEndPx: number;
  readonly onCommit: (fraction: number) => void;
}

/**
 * A draggable divider between two flex panes.
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
