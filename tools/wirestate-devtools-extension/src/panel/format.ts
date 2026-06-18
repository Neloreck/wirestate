import { type DevtoolsEvent } from "@wirestate/core/devtools";

import { type DehydratedRef } from "@/backend/backend.dehydrate";
import { type Optional } from "@/types/general";

/**
 * Epoch-ms timestamp of a delta, if it has one (older cores may omit lifecycle/registration times).
 *
 * @param event
 */
export function timestampOf(event: DevtoolsEvent): Optional<number> {
  if (event.kind === "message") {
    return event.message.timestamp;
  }

  return (event as { timestamp?: number }).timestamp;
}

/**
 * Formats an epoch-ms timestamp as a 24h clock time with milliseconds.
 *
 * @param timestamp
 */
export function formatClock(timestamp: number): string {
  const date: Date = new Date(timestamp);

  return `${date.toLocaleTimeString(undefined, { hour12: false })}.${String(date.getMilliseconds()).padStart(3, "0")}`;
}

/**
 * One-line summary of a delta, used for both display and text filtering.
 *
 * @param event - The devtools delta to summarize.
 * @returns A single-line, human-readable summary of the delta.
 */
export function summarize(event: DevtoolsEvent): string {
  switch (event.kind) {
    case "lifecycle":
      return `${event.phase}${event.instance ? ` · ${event.instance.className}` : ""}`;
    case "message":
      return `${event.message.channel} · ${event.message.type} · ${preview(event.message.payload)}`;
    case "registration":
      return `${event.registration.phase} · ${event.registration.channel} · ${event.registration.type}`;
    default:
      return "unknown";
  }
}

/**
 * Compact, depth-limited string for a (possibly dehydrated) value.
 *
 * @param value - The value to render.
 * @param depth - Current recursion depth; values nested deeper than the limit collapse to an ellipsis.
 * @returns A compact, single-line string representation of the value.
 */
export function preview(value: unknown, depth = 0): string {
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
    if (depth > 1) {
      return "[…]";
    }

    const head: string = value
      .slice(0, 5)
      .map((item) => preview(item, depth + 1))
      .join(", ");

    return `[${head}${value.length > 5 ? ", …" : ""}]`;
  }

  if (typeof value === "object") {
    const ref: Partial<DehydratedRef> = value as Partial<DehydratedRef>;

    if (typeof ref.__wsType === "string") {
      if (ref.__wsType === "undefined") {
        return "undefined";
      }

      if (ref.__wsType === "instance") {
        return `${ref.className ?? "Object"} ${preview(ref.value ?? {}, depth + 1)}`;
      }

      return ref.preview ?? ref.__wsType;
    }

    if (depth > 1) {
      return "{…}";
    }

    const record: Record<string, unknown> = value as Record<string, unknown>;
    const keys: Array<string> = Object.keys(record);
    const head: string = keys
      .slice(0, 5)
      .map((key) => `${key}: ${preview(record[key], depth + 1)}`)
      .join(", ");

    return `{${head}${keys.length > 5 ? ", …" : ""}}`;
  }

  return String(value);
}
