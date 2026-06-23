import { type DevtoolsEvent, type DevtoolsMessageChannel } from "@wirestate/core/devtools";

import { type Optional } from "@/types/general";

/**
 * The kinds of timeline delta the panel can filter by.
 */
export type EventKind = Exclude<DevtoolsEvent["kind"], "messageResult">;

/**
 * The single entity selected in the Navigator, identified within its container. Bindings are the unit
 * of selection for everything a container resolves: a `Value` binding shows its value, and an
 * `Instance` binding shows its realized instance's live detail (status, handlers, state) inline — so
 * there is no separate "instance" selection.
 */
export type Selection =
  | { readonly kind: "container"; readonly containerId: number }
  | { readonly kind: "binding"; readonly containerId: number; readonly token: string }
  | { readonly kind: "plugin"; readonly containerId: number; readonly name: string };

/**
 * The Timeline's independent filter state (single-select per dimension; `undefined` = all).
 */
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
 * @param first - First selection.
 * @param second - Second selection.
 * @returns Whether the two selections point at the same entity.
 */
export function isSameSelection(first: Selection, second: Selection): boolean {
  if (first.kind !== second.kind || first.containerId !== second.containerId) {
    return false;
  }

  switch (first.kind) {
    case "binding":
      return second.kind === "binding" && first.token === second.token;
    case "plugin":
      return second.kind === "plugin" && first.name === second.name;
    case "container":
      return true;
  }
}
