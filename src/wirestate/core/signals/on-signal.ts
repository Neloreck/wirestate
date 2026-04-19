import { type } from "@testing-library/user-event/dist/type";

import { log } from "@/macroses/log.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QUERY_HANDLER_METADATA, SIGNAL_HANDLER_METADATA } from "@/wirestate/core/registry";
import type { TSignalType } from "@/wirestate/types/signals";

/**
 * Decorator for service methods that respond to signals.
 *
 * @param types - signal type(s) to handle. If omitted, handles all signals
 * @returns decorator function
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
    log.info(prefix(__filename), "Attaching OnSignal metadata:", {
      name: target.constructor.name,
      types,
      propertyKey,
      target,
      constructor: target.constructor,
    });

    const constructor = target.constructor;
    let list = SIGNAL_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      SIGNAL_HANDLER_METADATA.set(constructor, list);
    }

    // Register handler metadata for prototype-based retrieval.
    list.push({ methodName: propertyKey, types: normalized });
  };
}
