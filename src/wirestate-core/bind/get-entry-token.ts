import type { Newable, ServiceIdentifier } from "inversify";

import type { InjectableDescriptor } from "../types/privision";

/**
 * Resolves the identifier for a given entry.
 *
 * @remarks
 * Handles both plain service classes and injectable descriptors:
 * - If `entry` is a class constructor, it is returned as the identifier.
 * - If `entry` is an {@link InjectableDescriptor}, its `id` field is returned.
 *
 * @group Bind
 *
 * @template T - Type of the injectable object.
 *
 * @param entry - Class constructor or descriptor to get the identifier for.
 * @returns Identifier token for Inversify.
 *
 * @example
 * ```typescript
 * class MyService {}
 *
 * getEntryToken(MyService); // returns MyService
 *
 * getEntryToken({ id: "my-service" }); // returns "my-service"
 * ```
 */
export function getEntryToken<T extends object = object>(entry: Newable<T> | InjectableDescriptor): ServiceIdentifier {
  return typeof entry === "function" ? entry : entry.id;
}
