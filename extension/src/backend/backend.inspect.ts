import { type DevtoolsServiceRef } from "@wirestate/core/devtools";

import { type InspectNode } from "@/bridge/bridge.messages";
import { type Optional } from "@/types/general";

// One-level lazy-read caps: a short string preview (the panel drills in by path for more) but a
// generous key count, since only this single level is materialized per request. Cf. the eager
// whole-payload caps in backend.dehydrate.ts.
const MAX_KEYS: number = 100;
const MAX_STRING: number = 200;

/**
 * Builds the descriptor for a field whose value is another container-managed instance, so the panel
 * can mark it and offer a jump to that instance instead of expanding it inline.
 *
 * @param ref - The service reference the in-page hook resolved for the field's value.
 * @returns A clone-safe `service` node.
 */
export function serviceNode(ref: DevtoolsServiceRef): InspectNode {
  return {
    t: "service",
    preview: ref.className,
    className: ref.className,
    containerId: ref.containerId,
    instanceId: ref.instanceId,
  };
}

/**
 * Describes **one level** of a raw in-page value for the panel: primitives and non-clonable leaves
 * inline, objects with their child keys, arrays with their length — so the panel lazily requests
 * deeper levels by path rather than serializing a whole (possibly cyclic) graph at once.
 *
 * @param value - Raw value at the inspected path.
 * @returns A clone-safe, one-level descriptor.
 */
export function describeNode(value: unknown): InspectNode {
  if (value === null) {
    return { t: "primitive", value: null };
  }

  switch (typeof value) {
    case "string":
      return { t: "primitive", value: value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value };
    case "number":
    case "boolean":
      return { t: "primitive", value };
    case "undefined":
      return { t: "leaf", preview: "undefined" };
    case "bigint":
      return { t: "leaf", preview: `${value.toString()}n` };
    case "symbol":
      return { t: "leaf", preview: value.toString() };
    case "function": {
      const fn: { name?: string } = value as { name?: string };

      return { t: "leaf", preview: fn.name ? `ƒ ${fn.name}()` : "ƒ ()" };
    }
    default:
      break;
  }

  const object: object = value as object;

  if (Array.isArray(object)) {
    return { t: "array", preview: `Array(${object.length})`, length: Math.min(object.length, MAX_KEYS) };
  }

  if (object instanceof Map) {
    return { t: "leaf", preview: `Map(${object.size})` };
  }

  if (object instanceof Set) {
    return { t: "leaf", preview: `Set(${object.size})` };
  }

  if (typeof Node !== "undefined" && object instanceof Node) {
    return { t: "leaf", preview: ((object as { nodeName?: string }).nodeName ?? "Node").toLowerCase() };
  }

  const className: Optional<string> = object.constructor?.name;

  return {
    t: "object",
    preview: className && className !== "Object" ? className : "{…}",
    keys: Object.keys(object).slice(0, MAX_KEYS),
  };
}
