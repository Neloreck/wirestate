import { Maybe } from "../types/general";

import { getPrototypeChainMetadata } from "./prototype-chain";

/**
 * Appends an entry to a constructor's handler-metadata list, creating it on first use.
 *
 * @remarks
 * Backs the `@OnEvent`, `@OnQuery`, and `@OnCommand` decorators, which record
 * one entry per decorated method for later prototype-chain retrieval.
 *
 * @group Metadata
 * @internal
 *
 * @template T - Handler metadata entry type.
 *
 * @param registry - Registry keyed by class constructor.
 * @param constructor - Constructor that owns the decorated method.
 * @param entry - Metadata entry to record.
 */
export function appendHandlerMetadata<T>(registry: WeakMap<object, Array<T>>, constructor: object, entry: T): void {
  let list: Maybe<Array<T>> = registry.get(constructor);

  if (!list) {
    list = [];
    registry.set(constructor, list);
  }

  list.push(entry);
}

/**
 * Collects a class hierarchy's handler-metadata entries in base-to-derived order.
 *
 * @remarks
 * Entries are flattened from the prototype chain so base-class handlers come
 * before derived-class handlers.
 *
 * @group Metadata
 * @internal
 *
 * @template T - Handler metadata entry type.
 *
 * @param instance - Instance to scan.
 * @param registry - Registry keyed by class constructor.
 * @returns Handler metadata entries, ordered from base to derived class.
 */
export function collectHandlerMetadata<T>(instance: object, registry: WeakMap<object, Array<T>>): ReadonlyArray<T> {
  return getPrototypeChainMetadata(instance, registry).reverse().flat();
}
