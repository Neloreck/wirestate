import {
  type DevtoolsMessageEvent,
  type DevtoolsMessageResultEvent,
  type DevtoolsEvent,
} from "@wirestate/core/devtools";
import { useState } from "react";

import { formatClock, summarize, timestampOf } from "@/panel/format";
import { type PanelActions } from "@/panel/use-panel-state";

const TAG_COLOR: Record<DevtoolsEvent["kind"], string> = {
  lifecycle: "text-sky-600 dark:text-sky-400",
  message: "text-fuchsia-600 dark:text-fuchsia-400",
  registration: "text-amber-600 dark:text-amber-400",
  messageResult: "text-fg-muted",
};

interface TimelineRowProps {
  readonly event: DevtoolsEvent;
  readonly count: number;
  readonly actions: PanelActions;
  readonly result?: DevtoolsMessageResultEvent;
}

/** One Timeline delta. Message rows expand inline to show the dehydrated payload (and any result). */
export function TimelineRow({ event, count, actions, result }: TimelineRowProps) {
  const [open, setOpen] = useState(false);
  const expandable: boolean = event.kind === "message";
  const timestamp = timestampOf(event);

  return (
    <div className={"border-b border-divider-subtle"}>
      <div
        className={`flex items-center gap-2 px-2.5 py-0.5 ${expandable ? "cursor-pointer" : ""}`}
        onClick={expandable ? () => setOpen((value) => !value) : undefined}
      >
        <span className={"w-[88px] shrink-0 text-fg-subtle tabular-nums"}>
          {timestamp === undefined ? "" : formatClock(timestamp)}
        </span>
        <span className={`min-w-[84px] shrink-0 ${TAG_COLOR[event.kind]}`}>{event.kind}</span>
        <span className={"flex-1 truncate"}>{summarize(event)}</span>
        {count > 1 ? (
          <span className={"rounded bg-selected px-1 text-[10px]"}>×{count}</span>
        ) : null}
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
        <pre
          className={
            "overflow-auto bg-elevated px-2.5 py-1 text-[11px] text-fg"
          }
        >
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
    `payload: ${stringify(message.payload, 0)}`,
  ];

  if (message.source !== undefined) {
    lines.push(`source: ${stringify(message.source, 0)}`);
  }

  if (result) {
    lines.push(`result (${result.outcome}): ${stringify(result.value, 0)}`);
  }

  return lines.join("\n");
}

/** Pretty-prints a (possibly dehydrated) value as an indented block. */
function stringify(value: unknown, depth: number): string {
  const pad: string = "  ".repeat(depth);

  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }

    return `[\n${value.map((item) => `${pad}  ${stringify(item, depth + 1)}`).join(",\n")}\n${pad}]`;
  }

  if (typeof value === "object") {
    const ref = value as { __wsType?: string; preview?: string; className?: string; value?: Record<string, unknown> };

    if (typeof ref.__wsType === "string") {
      if (ref.__wsType === "undefined") {
        return "undefined";
      }

      if (ref.__wsType === "instance") {
        return `${ref.className ?? "Object"} ${stringify(ref.value ?? {}, depth)}`;
      }

      return ref.preview ?? ref.__wsType;
    }

    const entries: Array<[string, unknown]> = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return "{}";
    }

    return `{\n${entries.map(([key, item]) => `${pad}  ${key}: ${stringify(item, depth + 1)}`).join(",\n")}\n${pad}}`;
  }

  return String(value);
}
