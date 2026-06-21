import {
  type DevtoolsMessageEvent,
  type DevtoolsMessageResultEvent,
  type DevtoolsEvent,
} from "@wirestate/core/devtools";
import { useState } from "react";

import { EventSummary } from "@/panel/components/EventSummary";
import { EventTimeCells } from "@/panel/components/EventTimeCells";
import { Tag, type TagTone } from "@/panel/components/ui";
import { type PanelActions } from "@/panel/hooks/use-panel-state";
import { stringify } from "@/panel/lib/format";
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
  /** Timestamp of the first row shown, for the relative offset; `undefined` disables the Δ column. */
  readonly baseline?: Optional<number>;
}

/** One Timeline delta. Message rows expand inline to show the dehydrated payload (and any result). */
export function TimelineRow({ event, count, actions, result, baseline }: TimelineRowProps) {
  const [open, setOpen] = useState(false);
  const expandable: boolean = event.kind === "message";

  return (
    <div className={"border-b border-divider-subtle"}>
      <div
        className={`flex items-center gap-2 px-2.5 py-0.5 ${expandable ? "cursor-pointer" : ""}`}
        onClick={expandable ? () => setOpen((value) => !value) : undefined}
      >
        <EventTimeCells event={event} baseline={baseline} />
        <span className={"min-w-21 shrink-0"}>
          <Tag tone={KIND_TONE[event.kind]}>{event.kind}</Tag>
        </span>
        <span className={"flex-1 truncate"}>
          <EventSummary
            event={event}
            onSelectBinding={(containerId, token) => actions.select({ kind: "binding", containerId, token })}
          />
        </span>
        {count > 1 ? <span className={"rounded bg-selected px-1 text-2xs"}>×{count}</span> : null}
        <button
          type={"button"}
          title={"Select this container"}
          className={"shrink-0 text-fg-subtle hover:text-fg"}
          onClick={(domEvent) => {
            domEvent.stopPropagation();
            actions.select({ kind: "container", containerId: event.containerId });
          }}
        >
          bus: #{event.containerId}
        </button>
      </div>

      {open && event.kind === "message" ? (
        <pre className={"overflow-auto bg-elevated px-2.5 py-1 text-xs text-fg"}>
          {messageDetail(event, result)}
        </pre>
      ) : null}
    </div>
  );
}

function messageDetail(event: DevtoolsMessageEvent, result?: DevtoolsMessageResultEvent): string {
  const message = event.message;
  const lines: Array<string> = [
    `type: ${message.type}`,
    `channel: ${message.channel}`,
    `timestamp: ${new Date(message.timestamp).toISOString()}`,
    `payload: ${stringify(message.payload)}`,
  ];

  if (message.source !== undefined) {
    lines.push(`source: ${stringify(message.source)}`);
  }

  if (result) {
    lines.push(`result (${result.outcome}): ${stringify(result.value)}`);
  }

  return lines.join("\n");
}
