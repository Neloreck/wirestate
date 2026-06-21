import { type DevtoolsEvent } from "@wirestate/core/devtools";

import { dehydrate } from "@/backend/backend.dehydrate";

/**
 * Replaces a message delta's raw payload/source with a clone-safe preview; other deltas pass through.
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
 * Ensures every delta exposes a timestamp the panel can show uniformly. Messages already carry
 * `message.timestamp`; lifecycle/registration deltas from an older core may lack one, so stamp the
 * real observe time (the backend subscribes from `document_start`, so this ≈ emit time).
 *
 * @param event - The (already sanitized) delta.
 * @returns The delta, guaranteed to expose a timestamp.
 */
export function stampTime(event: DevtoolsEvent): DevtoolsEvent {
  if (event.kind === "message") {
    return event;
  }

  return (event as { timestamp?: number }).timestamp === undefined ? { ...event, timestamp: Date.now() } : event;
}
