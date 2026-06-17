import type { DevtoolsEvent, DevtoolsMessageChannel } from "@wirestate/core/devtools";

import type { Optional } from "@/types/general";

/** The kinds of timeline delta the panel can filter by. */
export type EventKind = DevtoolsEvent["kind"];

/** The single entity selected in the Navigator, identified within its container. */
export type Selection =
  | { readonly kind: "container"; readonly containerId: number }
  | { readonly kind: "instance"; readonly containerId: number; readonly className: string }
  | { readonly kind: "binding"; readonly containerId: number; readonly token: string }
  | { readonly kind: "plugin"; readonly containerId: number; readonly name: string };

/** The Timeline's independent filter state (single-select per dimension; `undefined` = all). */
export interface TimelineFilter {
  readonly rootId: Optional<number>;
  readonly containerId: Optional<number>;
  readonly kinds: Record<EventKind, boolean>;
  readonly channels: Record<DevtoolsMessageChannel, boolean>;
  readonly text: string;
}

/**
 * True when two selections point at the same entity (used to detect a survived selection).
 *
 * @param a
 * @param b
 */
export function sameSelection(a: Selection, b: Selection): boolean {
  if (a.kind !== b.kind || a.containerId !== b.containerId) {
    return false;
  }

  switch (a.kind) {
    case "instance":
      return a.className === (b as { className: string }).className;
    case "binding":
      return a.token === (b as { token: string }).token;
    case "plugin":
      return a.name === (b as { name: string }).name;
    default:
      return true;
  }
}
