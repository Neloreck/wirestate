import { type DevtoolsEvent } from "@wirestate/core/devtools";

import { type Optional } from "@/types/general";

/**
 * Epoch-ms timestamp of a delta, if it has one (older cores may omit lifecycle/registration times).
 *
 * @param event - The devtools delta to read the timestamp from.
 * @returns The epoch-ms timestamp, or `undefined` when the delta carries none.
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
 * @param timestamp - Epoch milliseconds to format.
 * @returns The clock time as `HH:MM:SS.mmm`.
 */
export function formatTimestamp(timestamp: number): string {
  const date: Date = new Date(timestamp);

  return `${date.toLocaleTimeString(undefined, { hour12: false })}.${String(date.getMilliseconds()).padStart(3, "0")}`;
}

/**
 * Formats a millisecond gap as a compact, signed delta (`+0ms`, `+12ms`, `+1.4s`).
 *
 * @param ms - Milliseconds elapsed since the reference event.
 * @returns A short relative-time label.
 */
export function formatDelta(ms: number): string {
  return ms < 1000 ? `+${ms}ms` : `+${(ms / 1000).toFixed(1)}s`;
}

/**
 * One-line summary of a delta, used for both display and text filtering.
 *
 * @param event - The devtools delta to summarize.
 * @returns A single-line, human-readable summary of the delta.
 */
export function summarizeDevtoolsEvent(event: DevtoolsEvent): string {
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

/** A dehydrated-ref marker decoded into the cases a value renderer must format. */
type DecodedRef =
  | { readonly kind: "undefined" }
  | { readonly kind: "instance"; readonly className: string; readonly value: Record<string, unknown> }
  | { readonly kind: "text"; readonly text: string };

/**
 * Decodes a backend `DehydratedRef` marker into the case a renderer formats, or `undefined`
 * when the value is a plain object the renderer should walk itself. The single place that interprets
 * every `__wsType`, so {@link preview} (single-line) and {@link stringify} (multi-line) can't drift.
 *
 * @param value - A non-null object that may carry a `__wsType` marker.
 * @returns The decoded ref, or `undefined` for a plain object.
 */
function decodeRef(value: object): Optional<DecodedRef> {
  const marker: Record<string, unknown> = value as Record<string, unknown>;
  const type: unknown = marker.__wsType;

  if (typeof type !== "string") {
    return undefined;
  }

  if (type === "undefined") {
    return { kind: "undefined" };
  }

  if (type === "instance") {
    return {
      kind: "instance",
      className: typeof marker.className === "string" ? marker.className : "Object",
      value: (marker.value as Record<string, unknown>) ?? {},
    };
  }

  return { kind: "text", text: typeof marker.preview === "string" ? marker.preview : type };
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
    const decoded: Optional<DecodedRef> = decodeRef(value);

    if (decoded) {
      switch (decoded.kind) {
        case "undefined":
          return "undefined";
        case "instance":
          return `${decoded.className} ${preview(decoded.value, depth + 1)}`;
        case "text":
          return decoded.text;
      }
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

/**
 * Pretty-prints a (possibly dehydrated) value as an indented multi-line block, for the Timeline's
 * expanded message payload.
 *
 * @param value - The value to render.
 * @param depth - Current indentation depth.
 * @returns A multi-line, indented string representation of the value.
 */
export function stringify(value: unknown, depth = 0): string {
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
    const decoded: Optional<DecodedRef> = decodeRef(value);

    if (decoded) {
      switch (decoded.kind) {
        case "undefined":
          return "undefined";
        case "instance":
          return `${decoded.className} ${stringify(decoded.value, depth)}`;
        case "text":
          return decoded.text;
      }
    }

    const entries: Array<[string, unknown]> = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return "{}";
    }

    return `{\n${entries.map(([key, item]) => `${pad}  ${key}: ${stringify(item, depth + 1)}`).join(",\n")}\n${pad}}`;
  }

  return String(value);
}
