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
 * Appends an entry to a standard decorator metadata object's handler list.
 *
 * @remarks
 * Standard decorator metadata objects prototype-chain to the parent class's
 * metadata object, so a plain key lookup can resolve the parent's array.
 * Pushing into that inherited array would corrupt the base class's entries;
 * this helper only pushes into an own array and otherwise defines a new one.
 *
 * @group Metadata
 * @internal
 *
 * @template T - Handler metadata entry type.
 *
 * @param metadata - Standard decorator metadata object of the class being defined.
 * @param key - Standard decorator metadata key for the handler list.
 * @param entry - Metadata entry to record.
 */
export function appendStandardHandlerMetadata<T>(metadata: DecoratorMetadataObject, key: symbol, entry: T): void {
  if (Object.hasOwn(metadata, key)) {
    (metadata[key] as Array<T>).push(entry);
  } else {
    metadata[key] = [entry];
  }
}

/**
 * Collects a class hierarchy's handler-metadata entries in base-to-derived order.
 *
 * @remarks
 * Entries are flattened from the prototype chain so base-class handlers come
 * before derived-class handlers. Both legacy WeakMap registries and, when
 * `metadataKey` is provided, standard decorator metadata are merged per
 * constructor.
 *
 * @group Metadata
 * @internal
 *
 * @template T - Handler metadata entry type.
 *
 * @param instance - Instance to scan.
 * @param registry - Registry keyed by class constructor.
 * @param metadataKey - Optional standard decorator metadata key to also read.
 * @returns Handler metadata entries, ordered from base to derived class.
 */
export function collectHandlerMetadata<T>(
  instance: object,
  registry: WeakMap<object, Array<T>>,
  metadataKey?: symbol
): ReadonlyArray<T> {
  return getPrototypeChainMetadata(instance, registry, metadataKey).reverse().flat();
}
