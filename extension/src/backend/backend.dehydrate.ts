import { type Optional } from "@/types/general";

/**
 * Lossy, bounded, cycle-safe serializer for raw in-page message payloads.
 */

// Eager whole-payload caps: strings stay long (the payload is the data you want to read) while
// depth and breadth are bounded, since the entire graph is serialized in one pass. The on-demand
// inspect path (backend.inspect.ts) previews one level lazily and so caps strings far shorter.
const MAX_DEPTH = 8;
const MAX_KEYS = 64;
const MAX_ARRAY = 128;
const MAX_STRING = 10_240;

/**
 * Marker the panel renders in place of a value that could not (or should not) be cloned whole.
 *
 * @remarks
 * Discriminated on `__wsType`. Bare markers carry nothing; preview markers carry a short
 * human-readable string; `"instance"` carries its class name and surviving own properties.
 */
export type DehydratedRef =
  | { readonly __wsType: "undefined" | "circular" }
  | {
      readonly __wsType: "bigint" | "symbol" | "function" | "maxDepth" | "node" | "map" | "set" | "truncated";
      readonly preview: string;
    }
  | { readonly __wsType: "instance"; readonly className: string; readonly value: Record<string, unknown> };

/**
 * Produces a structured-clone-safe preview of an arbitrary in-page value.
 *
 * @param value - The raw value to dehydrate.
 * @returns A value safe to `postMessage`, with non-clonable parts replaced by markers.
 */
export function dehydrate(value: unknown): unknown {
  return walk(value, 0, new WeakSet<object>());
}

function walk(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null) {
    return null;
  }

  switch (typeof value) {
    case "number":
    case "boolean":
      return value;
    case "string":
      return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}...` : value;
    case "undefined":
      return { __wsType: "undefined" } satisfies DehydratedRef;
    case "bigint":
      return { __wsType: "bigint", preview: `${value.toString()}n` } satisfies DehydratedRef;
    case "symbol":
      return { __wsType: "symbol", preview: value.toString() } satisfies DehydratedRef;
    case "function": {
      const fn: { name?: string } = value as { name?: string };

      return { __wsType: "function", preview: fn.name ? `ƒ ${fn.name}()` : "ƒ ()" } satisfies DehydratedRef;
    }
    default:
      break;
  }

  const object: object = value as object;

  if (depth >= MAX_DEPTH) {
    return { __wsType: "maxDepth", preview: describe(object) } satisfies DehydratedRef;
  }

  if (seen.has(object)) {
    return { __wsType: "circular" } satisfies DehydratedRef;
  }

  seen.add(object);

  try {
    if (typeof Node !== "undefined" && object instanceof Node) {
      const named: { nodeName?: string } = object as { nodeName?: string };

      return { __wsType: "node", preview: (named.nodeName ?? "Node").toLowerCase() } satisfies DehydratedRef;
    }

    if (object instanceof Map) {
      return { __wsType: "map", preview: `Map(${object.size})` } satisfies DehydratedRef;
    }

    if (object instanceof Set) {
      return { __wsType: "set", preview: `Set(${object.size})` } satisfies DehydratedRef;
    }

    if (Array.isArray(object)) {
      const head: Array<unknown> = object.slice(0, MAX_ARRAY).map((item) => walk(item, depth + 1, seen));

      if (object.length > MAX_ARRAY) {
        head.push({ __wsType: "truncated", preview: `… ${object.length - MAX_ARRAY} more` } satisfies DehydratedRef);
      }

      return head;
    }

    const props: Record<string, unknown> = {};
    const keys: Array<string> = Object.keys(object).slice(0, MAX_KEYS);

    for (const key of keys) {
      props[key] = walk((object as Record<string, unknown>)[key], depth + 1, seen);
    }

    const className: Optional<string> = object.constructor?.name;

    if (className && className !== "Object") {
      return { __wsType: "instance", className, value: props } satisfies DehydratedRef;
    }

    return props;
  } finally {
    seen.delete(object);
  }
}

function describe(object: object): string {
  const name: Optional<string> = object.constructor?.name;

  if (Array.isArray(object)) {
    return `Array(${object.length})`;
  }

  return name && name !== "Object" ? name : "{…}";
}
