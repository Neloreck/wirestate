import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { SIGNAL_HANDLER_METADATA } from "@/wirestate/core/registry";
import type { Maybe, Optional } from "@/wirestate/types/general";
import type { ISignalHandlerMetadata, TSignalType } from "@/wirestate/types/signals";

/**
 * Decorator for service methods that respond to signals.
 *
 * @param types - signal type(s) to handle. If omitted, handles all signals
 * @returns decorator function
 */
export function OnSignal(types?: TSignalType | ReadonlyArray<TSignalType>): MethodDecorator {
  // Normalize types to an array or null for catch-all.
  const normalized: Optional<ReadonlyArray<TSignalType>> =
    types === undefined
      ? null
      : Array.isArray(types)
        ? [...(types as ReadonlyArray<TSignalType>)]
        : [types as TSignalType];

  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnSignal metadata:", {
      name: target.constructor.name,
      types,
      propertyKey,
      target,
      constructor: target.constructor,
    });

    const constructor = target.constructor;

    let list: Maybe<Array<ISignalHandlerMetadata>> = SIGNAL_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      SIGNAL_HANDLER_METADATA.set(constructor, list);
    }

    // Register handler metadata for prototype-based retrieval.
    list.push({ methodName: propertyKey, types: normalized });
  };
}
