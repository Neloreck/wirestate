import { type DevtoolsServiceRef } from "#/devtools";

import { type InspectNode } from "@/bridge/bridge.messages";
import { type Optional } from "@/types/general";

// One-level lazy-read caps.
const MAX_KEYS: number = 128;
const MAX_STRING: number = 256;

/**
 * Builds the descriptor for a field whose value is another container-managed instance, so the panel
 * can mark it and offer a jump to that instance instead of expanding it inline.
 *
 * @param ref - The service reference the in-page hook resolved for the field's value.
 * @returns A clone-safe `service` node.
 */
export function createServiceInspectNode(ref: DevtoolsServiceRef): InspectNode {
  return {
    kind: "service",
    preview: ref.className,
    className: ref.className,
    containerId: ref.containerId,
    instanceId: ref.instanceId,
  };
}

/**
 * Describes one level of a raw in-page value for the panel: primitives and non-clonable leaves
 * inline, objects with their child keys, arrays with their length — so the panel lazily requests
 * deeper levels by path rather than serializing a whole graph at once.
 *
 * @param value - Raw value at the inspected path.
 * @returns A clone-safe, one-level descriptor.
 */
export function createInspectNode(value: unknown): InspectNode {
  if (value === null) {
    return { kind: "primitive", value: null };
  }

  switch (typeof value) {
    case "string":
      return { kind: "primitive", value: value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value };

    case "number":
    case "boolean":
      return { kind: "primitive", value };

    case "undefined":
      return { kind: "leaf", preview: "undefined" };

    case "bigint":
      return { kind: "leaf", preview: `${value.toString()}n` };

    case "symbol":
      return { kind: "leaf", preview: value.toString() };

    case "function": {
      const fn: { name?: string } = value as { name?: string };

      return { kind: "leaf", preview: fn.name ? `ƒ ${fn.name}()` : "ƒ ()" };
    }
    default:
      break;
  }

  const object: object = value as object;

  if (Array.isArray(object)) {
    return { kind: "array", preview: `Array(${object.length})`, length: Math.min(object.length, MAX_KEYS) };
  } else if (object instanceof Map) {
    return { kind: "leaf", preview: `Map(${object.size})` };
  } else if (object instanceof Set) {
    return { kind: "leaf", preview: `Set(${object.size})` };
  } else if (typeof Node !== "undefined" && object instanceof Node) {
    return { kind: "leaf", preview: ((object as { nodeName?: string }).nodeName ?? "Node").toLowerCase() };
  }

  const className: Optional<string> = object.constructor?.name;

  return {
    kind: "object",
    preview: className && className !== "Object" ? className : "{...}",
    keys: Object.keys(object).slice(0, MAX_KEYS),
  };
}
