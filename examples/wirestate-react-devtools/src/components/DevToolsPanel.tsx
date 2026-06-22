import "./DevToolsPanel.css";

import {
  type DevtoolsEvent,
  type DevtoolsHook,
  type DevtoolsInstanceStatus,
  type DevtoolsMessageResultEvent,
  type DevtoolsRootSnapshot,
  getDevtoolsHook,
} from "@wirestate/core/devtools";
import { useEffect, useMemo, useState } from "react";

const MAX_LOG: number = 100;

export function DevToolsPanel() {
  const [roots, setRoots] = useState<ReadonlyArray<DevtoolsRootSnapshot>>([]);
  const [log, setLog] = useState<ReadonlyArray<DevtoolsEvent>>([]);

  useEffect(() => {
    const hook: DevtoolsHook | undefined = getDevtoolsHook();

    if (!hook) {
      return;
    }

    const refresh = (): void => setRoots(hook.getRoots().map((root) => root.snapshot()));

    refresh();

    return hook.subscribe((event: DevtoolsEvent): void => {
      setLog((previous) => [...previous, event].slice(-MAX_LOG));
      refresh();
    });
  }, []);

  // Command/query results aren't standalone rows — they correlate to their dispatch by id and are
  // shown inline on the message row (mirrors the extension's message accordion).
  const results: ReadonlyMap<number, DevtoolsMessageResultEvent> = useMemo(() => {
    const map = new Map<number, DevtoolsMessageResultEvent>();

    for (const event of log) {
      if (event.kind === "messageResult") {
        map.set(event.messageId, event);
      }
    }

    return map;
  }, [log]);

  const rows: ReadonlyArray<DevtoolsEvent> = useMemo(
    () => log.filter((event) => event.kind !== "messageResult"),
    [log],
  );

  // Reads a `Value` binding's live value directly from the in-realm hook (no bridge, unlike the
  // extension). Returns `undefined` when the root is gone — `preview` renders that safely.
  const readBindingValue = (rootId: number, bindingId: number): unknown =>
    getDevtoolsHook()
      ?.getRoots()
      .find((entry) => entry.rootId === rootId)
      ?.inspectBinding(bindingId, []);

  if (roots.length === 0) {
    return <div className={"devtools__empty"}>No devtools hook found — is the DevToolsPlugin installed?</div>;
  }

  return (
    <div className={"devtools"}>
      <div className={"devtools__tree"}>
        {roots.map((root) => (
          <div key={root.rootId} className={"devtools__root"}>
            <div className={"devtools__root-head"}>
              <span className={"devtools__root-label"}>{root.label ?? `root #${root.rootId}`}</span>
              <span className={"devtools__root-meta"}>
                #{root.rootId} · protocol v{root.protocolVersion}
              </span>
            </div>

            {root.containers.map((container) => (
              <div key={container.containerId} className={"devtools__container"}>
                <div className={"devtools__container-head"}>
                  container #{container.containerId}
                  {container.parentContainerId === null ? " (root)" : ` ◂ #${container.parentContainerId}`}
                </div>

                <div className={"devtools__row"}>
                  <span className={"devtools__label"}>plugins</span>
                  <span>{container.plugins.map((plugin) => plugin.name).join(", ") || "—"}</span>
                </div>

                <div className={"devtools__row"}>
                  <span className={"devtools__label"}>bindings</span>
                  <span>
                    {container.bindings
                      .map((binding) => {
                        const base = `${binding.token.name} · ${binding.type} · ${binding.scope}`;

                        // A Value binding shows its live raw value inline — the in-realm twin of the
                        // extension panel's on-demand value tree.
                        return binding.type === "Value"
                          ? `${base} = ${preview(readBindingValue(root.rootId, binding.bindingId))}`
                          : base;
                      })
                      .join(", ") || "—"}
                  </span>
                </div>

                <ul className={"devtools__instances"}>
                  {container.instances.map((instance) => {
                    const status = describeStatus(instance.status);

                    return (
                      <li key={instance.instanceId} className={"devtools__instance"}>
                        <span className={"devtools__instance-name"}>
                          <span className={`devtools__badge devtools__badge--${status.tone}`} title={status.detail}>
                            {status.text}
                          </span>
                          {instance.className}
                        </span>
                        {instance.handlers.length > 0 ? (
                          <span className={"devtools__handlers"}>
                            {instance.handlers.map((handler) => `${handler.channel}:${handler.type}`).join(", ")}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={"devtools__log"}>
        {rows.length === 0 ? (
          <div className={"devtools__empty"}>No activity yet — interact with the app above.</div>
        ) : (
          rows.map((event, index) => {
            const timestamp = timestampOf(event);
            const result = event.kind === "message" ? results.get(event.message.id) : undefined;

            return (
              <div key={index} className={`devtools__event devtools__event--${event.kind}`}>
                <div className={"devtools__event-line"}>
                  <span className={"devtools__time"}>{timestamp === undefined ? "" : formatClock(timestamp)}</span>
                  <span className={"devtools__kind"}>{event.kind}</span>
                  <span className={"devtools__summary"}>{summarize(event)}</span>
                </div>

                {result ? (
                  <div className={`devtools__result devtools__result--${result.outcome}`}>
                    → {result.outcome}: {preview(result.value)}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Epoch-ms timestamp of a delta. Lifecycle / registration / result deltas carry it top-level;
 * messages carry it on the message.
 *
 * @param event - The delta to read.
 * @returns The timestamp, or `undefined` when the delta has none.
 */
function timestampOf(event: DevtoolsEvent): number | undefined {
  return event.kind === "message" ? event.message.timestamp : event.timestamp;
}

/**
 * Formats an epoch-ms timestamp as a 24h clock time with milliseconds.
 *
 * @param timestamp - Epoch milliseconds.
 * @returns A `HH:MM:SS.mmm` string.
 */
function formatClock(timestamp: number): string {
  const date: Date = new Date(timestamp);

  return `${date.toLocaleTimeString(undefined, { hour12: false })}.${String(date.getMilliseconds()).padStart(3, "0")}`;
}

/**
 * One-line summary of a delta, including a payload/value preview for messages and results.
 *
 * @param event - The delta to summarize.
 * @returns A single-line, human-readable summary.
 */
function summarize(event: DevtoolsEvent): string {
  switch (event.kind) {
    case "lifecycle":
      return `${event.phase}${event.instance ? ` · ${event.instance.className}` : ""}`;

    case "message":
      return `${event.message.channel} · ${event.message.type} · ${preview(event.message.payload)}`;

    case "registration":
      return `${event.registration.phase} · ${event.registration.channel} · ${event.registration.type}`;

    case "messageResult":
      return `${event.outcome} · ${preview(event.value)}`;

    default:
      return "unknown";
  }
}

/**
 * Maps an instance's lifecycle status to a compact badge label, tone, and a verbose tooltip.
 *
 * @param status - The instance status, or `undefined` when the instance is untracked.
 * @returns Badge text, a CSS tone, and a detailed provision description.
 */
function describeStatus(status: DevtoolsInstanceStatus | undefined): {
  text: string;
  tone: "active" | "inactive" | "muted";
  detail: string;
} {
  if (!status) {
    return { text: "untracked", tone: "muted", detail: "instance is not tracked" };
  }

  const provision: string =
    status.isDeprovisioned === null ? "not provisioned" : status.isDeprovisioned ? "deprovisioned" : "owned";
  const detail = `provision: ${provision}${status.provisionId === null ? "" : ` (cycle ${status.provisionId})`}${
    status.isDeactivated ? " · deactivated" : ""
  }`;

  return status.isInactive
    ? { text: "inactive", tone: "inactive", detail }
    : { text: "active", tone: "active", detail };
}

/**
 * Compact, depth-limited, cycle-safe string for a raw in-page value. Unlike the cross-process
 * extension (which renders backend-dehydrated refs), the in-page panel sees live values directly,
 * so this handles dates, class instances, and functions defensively.
 *
 * @param value - The value to render.
 * @param depth - Current recursion depth; values nested deeper than the limit collapse to an ellipsis.
 * @param seen - Objects already visited on this branch, to guard against cycles.
 * @returns A compact, single-line string representation of the value.
 */
function preview(value: unknown, depth: number = 0, seen: WeakSet<object> = new WeakSet()): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  const type: string = typeof value;

  if (type === "string") {
    return JSON.stringify(value);
  }

  if (type === "number" || type === "boolean" || type === "bigint") {
    return String(value);
  }

  if (type === "function") {
    return `ƒ ${(value as { name?: string }).name || "anonymous"}()`;
  }

  if (type === "symbol") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const object: object = value as object;

  if (seen.has(object)) {
    return "[circular]";
  }

  if (depth > 1) {
    return Array.isArray(value) ? "[…]" : "{…}";
  }

  seen.add(object);

  if (Array.isArray(value)) {
    const head: string = value
      .slice(0, 5)
      .map((item) => preview(item, depth + 1, seen))
      .join(", ");

    return `[${head}${value.length > 5 ? ", …" : ""}]`;
  }

  const record: Record<string, unknown> = value as Record<string, unknown>;
  const keys: Array<string> = Object.keys(record);
  const head: string = keys
    .slice(0, 5)
    .map((key) => `${key}: ${preview(record[key], depth + 1, seen)}`)
    .join(", ");
  const body = `{${head}${keys.length > 5 ? ", …" : ""}}`;
  const constructor: string | undefined = object.constructor?.name;

  return constructor && constructor !== "Object" ? `${constructor} ${body}` : body;
}
