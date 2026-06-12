import { Definable, Maybe } from "../types/general";

import { METADATA_SYMBOL } from "./metadata-symbol";

/**
 * Reads a standard-decorator metadata value owned by a single constructor.
 *
 * @group Metadata
 * @internal
 *
 * @template T - Metadata value type.
 *
 * @param constructor - Constructor to inspect for own standard metadata.
 * @param metadataKey - Key under which the value is stored on the metadata object.
 * @returns The own metadata value, or `undefined` when none exists.
 */
function getOwnStandardMetadata<T>(constructor: object, metadataKey: symbol): Definable<T> {
  const descriptor: Maybe<PropertyDescriptor> = Object.getOwnPropertyDescriptor(constructor, METADATA_SYMBOL);

  if (descriptor?.value && Object.hasOwn(descriptor.value as object, metadataKey)) {
    return (descriptor.value as Record<symbol, T>)[metadataKey];
  }

  return undefined;
}

/**
 * Retrieves metadata registered on constructors in an instance's inheritance chain.
 *
 * @group Metadata
 * @internal
 *
 * @template T - Metadata value type.
 *
 * @param instance - The instance to inspect.
 * @param metadataRegistry - The constructor metadata registry to read from.
 * @param metadataKey - Optional standard decorator metadata key to also read.
 * @returns Constructor metadata entries ordered from derived class to base class.
 */
export function getPrototypeChainMetadata<T>(
  instance: object,
  metadataRegistry: WeakMap<object, T>,
  metadataKey?: symbol
): Array<T> {
  const metadata: Array<T> = [];

  let constructor: unknown = instance.constructor;

  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own: Definable<T> = metadataRegistry.get(constructor);

    if (own !== undefined) {
      metadata.push(own);
    }

    // TC39 variant with 3rd parameter defined:
    if (metadataKey !== undefined) {
      const standard: Definable<T> = getOwnStandardMetadata(constructor, metadataKey);

      if (standard !== undefined) {
        metadata.push(standard);
      }
    }

    constructor = Object.getPrototypeOf(constructor);
  }

  return metadata;
}
