import { type PointerEvent as ReactPointerEvent, type RefObject, useRef, useState } from "react";

import { cn } from "@/lib/class-name";
import { type Nullable } from "@/types/general";

interface ResizeHandleProps {
  readonly orientation: "vertical" | "horizontal";
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
    document.body.style.cursor = orientation === "vertical" ? "col-resize" : "row-resize";
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
    const size: number = orientation === "vertical" ? rect.width : rect.height;

    if (size <= 0) {
      return;
    }

    const offset: number = orientation === "vertical" ? event.clientX - rect.left : event.clientY - rect.top;
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

  return (
    <div
      className={cn(
        `group relative flex-none`,
        orientation === "vertical" ? "w-[5px] cursor-col-resize self-stretch" : "h-[5px] w-full cursor-row-resize"
      )}
      role={"separator"}
      aria-orientation={orientation}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <span
        className={cn(
          "absolute",
          dragging ? "bg-fg-subtle" : "bg-divider group-hover:bg-fg-subtle",
          orientation === "vertical"
            ? "inset-y-0 left-1/2 w-px -translate-x-1/2"
            : "inset-x-0 top-1/2 h-px -translate-y-1/2"
        )}
      />
    </div>
  );
}
