/**
 * Retrieves metadata registered on constructors in an instance's inheritance chain.
 *
 * @group Metadata
 * @internal
 *
 * @param instance - The instance to inspect.
 * @param metadataRegistry - The constructor metadata registry to read from.
 * @returns Constructor metadata entries ordered from derived class to base class.
 */
export function getPrototypeChainMetadata<T>(instance: object, metadataRegistry: WeakMap<object, T>): Array<T> {
  const metadata: Array<T> = [];

  let constructor: unknown = instance.constructor;

  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own = metadataRegistry.get(constructor);

    if (own !== undefined) {
      metadata.push(own);
    }

    constructor = Object.getPrototypeOf(constructor);
  }

  return metadata;
}
