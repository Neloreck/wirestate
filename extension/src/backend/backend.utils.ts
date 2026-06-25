import { type DevtoolsEvent } from "#/devtools";

import { dehydrate } from "@/backend/backend.dehydrate";

/**
 * Replaces a message delta's raw payload/source with a clone-safe preview, other deltas pass through.
 *
 * @param event - The devtools delta to sanitize.
 * @returns The delta with any message payload and source cloned for safe transfer.
 */
export function sanitizeDevtoolsEvent(event: DevtoolsEvent): DevtoolsEvent {
  if (event.kind === "message") {
    return {
      ...event,
      message: {
        ...event.message,
        payload: dehydrate(event.message.payload),
        source: dehydrate(event.message.source),
      },
    };
  }

  if (event.kind === "messageResult") {
    return { ...event, value: dehydrate(event.value) };
  }

  return event;
}

/**
 * Ensures every delta exposes a timestamp the panel can show uniformly.
 *
 * @param event - The already sanitized delta event.
 * @returns The delta, guaranteed to expose a timestamp.
 */
export function stampTimeInDevtoolsEvent(event: DevtoolsEvent): DevtoolsEvent {
  if (event.kind === "message") {
    return event;
  }

  return (event as { timestamp?: number }).timestamp === undefined ? { ...event, timestamp: Date.now() } : event;
}
