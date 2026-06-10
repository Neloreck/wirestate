import { Maybe } from "../types/general";

import { METADATA_SYMBOL } from "./symbol-metadata";

/**
 * Reads a standard-decorator metadata value owned by a single constructor.
 *
 * @remarks
 * Two own-property checks are mandatory: `Symbol.metadata` itself is inherited
 * through the constructor prototype chain, and the metadata object inherits
 * keys from the parent class's metadata object. Without both checks, base
 * class metadata would be re-attributed to derived classes.
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
function getOwnStandardMetadata<T>(constructor: object, metadataKey: symbol): T | undefined {
  const descriptor: Maybe<PropertyDescriptor> = Object.getOwnPropertyDescriptor(constructor, METADATA_SYMBOL);

  if (descriptor?.value && Object.hasOwn(descriptor.value as object, metadataKey)) {
    return (descriptor.value as Record<symbol, T>)[metadataKey];
  }

  return undefined;
}

/**
 * Retrieves metadata registered on constructors in an instance's inheritance chain.
 *
 * @remarks
 * For each constructor in the chain, both storage channels are read: the
 * legacy decorator WeakMap registry and, when `metadataKey` is provided, the
 * own standard decorator metadata attached at `Symbol.metadata`. Per
 * constructor, the legacy value comes first.
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
    const own: T | undefined = metadataRegistry.get(constructor);

    if (own !== undefined) {
      metadata.push(own);
    }

    if (metadataKey !== undefined) {
      const standard: T | undefined = getOwnStandardMetadata(constructor, metadataKey);

      if (standard !== undefined) {
        metadata.push(standard);
      }
    }

    constructor = Object.getPrototypeOf(constructor);
  }

  return metadata;
}
