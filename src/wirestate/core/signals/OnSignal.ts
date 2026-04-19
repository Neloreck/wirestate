import { SIGNAL_HANDLER_METADATA } from "../registry";
import type { TSignalType } from "../types/signals";

/**
 * Decorator for service methods that respond to signals.
 *
 * @param types - signal type(s) to handle. If omitted, handles all signals
 */
export function OnSignal(types?: TSignalType | ReadonlyArray<TSignalType>): MethodDecorator {
  // Normalize types to an array or null for catch-all.
  const normalized: ReadonlyArray<TSignalType> | null =
    types === undefined
      ? null
      : Array.isArray(types)
        ? [...(types as ReadonlyArray<TSignalType>)]
        : [types as TSignalType];

  return (target, propertyKey) => {
    const ctor = target.constructor;
    let list = SIGNAL_HANDLER_METADATA.get(ctor);

    if (!list) {
      list = [];
      SIGNAL_HANDLER_METADATA.set(ctor, list);
    }

    // Register handler metadata for prototype-based retrieval.
    list.push({ methodName: propertyKey, types: normalized });
  };
}
