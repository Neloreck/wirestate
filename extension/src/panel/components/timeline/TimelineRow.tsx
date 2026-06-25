import { useCallback, useState, type MouseEvent } from "react";

import { type DevtoolsMessageResultEvent, type DevtoolsEvent } from "#/devtools";

import { cn } from "@/lib/class-name";
import { EventSummary } from "@/panel/components/EventSummary";
import { EventTimeCells } from "@/panel/components/EventTimeCells";
import { TimelineMessageDetail } from "@/panel/components/timeline/TimelineMessageDetail";
import { Tag, type TagTone } from "@/panel/components/ui";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { type Optional } from "@/types/general";

const KIND_TONE: Record<DevtoolsEvent["kind"], TagTone> = {
  lifecycle: "info",
  message: "accent",
  registration: "warn",
  messageResult: "muted",
};

interface TimelineRowProps {
  readonly event: DevtoolsEvent;
  readonly count: number;
  readonly actions: PanelActions;
  readonly result?: DevtoolsMessageResultEvent;
  readonly baseline?: Optional<number>;
}

/**
 * One Timeline delta.
 * Message rows expand inline to show the dehydrated payload (and any result).
 */
export function TimelineRow({ event, count, actions, result, baseline }: TimelineRowProps) {
  const [open, setOpen] = useState(false);

  const isExpandable: boolean = event.kind === "message";

  const onToggle = useCallback(() => {
    setOpen((it) => !it);
  }, []);

  const onSelectBinding = useCallback(
    (containerId: number, token: string) => actions.select({ kind: "binding", containerId, token }),
    [actions]
  );

  const onNavigateToContainer = useCallback(
    (domEvent: MouseEvent) => {
      domEvent.stopPropagation();
      actions.select({ kind: "container", containerId: event.containerId });
    },
    [actions, event.containerId]
  );

  return (
    <div className={"border-b border-divider-subtle"}>
      <div
        className={cn("flex items-center gap-2 px-2.5 py-0.5", isExpandable ? "cursor-pointer" : null)}
        onClick={isExpandable ? onToggle : undefined}
      >
        <EventTimeCells event={event} baseline={baseline} />

        <span className={"min-w-21 shrink-0"}>
          <Tag tone={KIND_TONE[event.kind]}>{event.kind}</Tag>
        </span>

        <span className={"flex-1 truncate"}>
          <EventSummary event={event} onSelectBinding={onSelectBinding} />
        </span>

        {count > 1 ? <span className={"rounded bg-selected px-1 text-2xs"}>×{count}</span> : null}

        <button
          className={"shrink-0 cursor-pointer text-fg-subtle hover:text-fg"}
          type={"button"}
          title={"Select this container"}
          onClick={onNavigateToContainer}
        >
          #{event.containerId}
        </button>
      </div>

      {open && event.kind === "message" ? (
        <pre className={"overflow-auto bg-elevated px-2.5 py-1 text-xs text-fg"}>
          <TimelineMessageDetail message={event.message} result={result} />
        </pre>
      ) : null}
    </div>
  );
}
