import { type DevtoolsEvent, type DevtoolsMessageChannel, type DevtoolsMessageResultEvent } from "#/devtools";

import { type TimelineFilter } from "@/panel/hooks/use-panel-state";
import { getDevtoolsEventSummary } from "@/panel/lib/format";
import { type Optional } from "@/types/general";

/**
 * The channel a delta flowed through, or `undefined` for lifecycle deltas.
 *
 * @param event - The devtools delta to read.
 * @returns The message/registration channel, or `undefined` for a lifecycle delta.
 */
export function getChannelOfEvent(event: DevtoolsEvent): Optional<DevtoolsMessageChannel> {
  if (event.kind === "message") {
    return event.message.channel;
  }

  if (event.kind === "registration") {
    return event.registration.channel;
  }

  return undefined;
}

/**
 * Lifecycle deltas for one container, optionally narrowed to one instance. Narrowing prefers the
 * exact `instanceId`, falling back to `className` when the target has no id (an older core that
 * predates the instance handle — target and deltas come from the same core, so either both carry
 * ids or neither does).
 *
 * @param log - The delta buffer to filter.
 * @param containerId - The container whose lifecycle deltas to keep.
 * @param instance - Optional instance to narrow to.
 * @param instance.instanceId - The instance's stable id, preferred when present.
 * @param instance.className - The instance's class name, used when no id is available.
 * @returns The matching lifecycle deltas, in arrival order.
 */
export function getLifecycleHistory(
  log: ReadonlyArray<DevtoolsEvent>,
  containerId: number,
  instance?: { readonly instanceId?: number; readonly className?: string }
): ReadonlyArray<DevtoolsEvent> {
  return log.filter((event) => {
    if (event.kind !== "lifecycle" || event.containerId !== containerId) {
      return false;
    }

    if (!instance) {
      return true;
    }

    const subject = event.instance;

    if (!subject) {
      return false;
    }

    return instance.instanceId !== undefined
      ? subject.instanceId === instance.instanceId
      : subject.className === instance.className;
  });
}

/**
 * Applies the Timeline filter to the delta log.
 *
 * @param log - The full delta log.
 * @param filter - The active Timeline filter.
 * @returns The deltas that pass every filter dimension.
 */
export function filterLogBy(log: ReadonlyArray<DevtoolsEvent>, filter: TimelineFilter): ReadonlyArray<DevtoolsEvent> {
  const needle: string = filter.text.trim().toLowerCase();

  return log.filter((event) => {
    // Result deltas aren't standalone rows — they attach to their message's accordion.
    if (event.kind === "messageResult") {
      return false;
    }

    if (!filter.kinds[event.kind]) {
      return false;
    }

    if (filter.rootId !== undefined && event.rootId !== filter.rootId) {
      return false;
    }

    if (filter.containerId !== undefined && event.containerId !== filter.containerId) {
      return false;
    }

    const channel: Optional<DevtoolsMessageChannel> = getChannelOfEvent(event);

    if (channel !== undefined && !filter.channels[channel]) {
      return false;
    }

    return needle === "" || getDevtoolsEventSummary(event).toLowerCase().includes(needle);
  });
}

/**
 * Indexes the log's message-result deltas by the id of the message they correlate to, so a message
 * row can render its result inline. Last result wins when an id repeats.
 *
 * @param log - The delta log to index.
 * @returns A map from message id to its result delta.
 */
export function buildMessageResults(
  log: ReadonlyArray<DevtoolsEvent>
): ReadonlyMap<number, DevtoolsMessageResultEvent> {
  const results: Map<number, DevtoolsMessageResultEvent> = new Map();

  for (const event of log) {
    if (event.kind === "messageResult") {
      results.set(event.messageId, event);
    }
  }

  return results;
}

/**
 * One Timeline row: a delta plus how many consecutive identical deltas it stands for.
 */
export interface CollapsedRow {
  readonly event: DevtoolsEvent;
  readonly count: number;
}

/**
 * Collapses runs of consecutive identical deltas into one row carrying a repeat count, so a burst
 * of the same event reads as a single counted row instead of N rows. Identity is the rendered
 * event summary.
 *
 * @param events - The (already filtered) deltas to collapse, in arrival order.
 * @returns One row per run of identical deltas, in arrival order; the first delta of each run is kept.
 */
export function collapseTimeline(events: ReadonlyArray<DevtoolsEvent>): ReadonlyArray<CollapsedRow> {
  const rows: Array<{ event: DevtoolsEvent; count: number }> = [];

  for (const event of events) {
    const last = rows[rows.length - 1];

    if (last && getDevtoolsEventSummary(last.event) === getDevtoolsEventSummary(event)) {
      last.count += 1;
    } else {
      rows.push({ event, count: 1 });
    }
  }

  return rows;
}
