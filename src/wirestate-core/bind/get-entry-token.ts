import { Newable, ServiceIdentifier } from "../alias";
import { InjectableDescriptor } from "../types/provision";

/**
 * Returns the token for an entry.
 *
 * @remarks
 * Classes are their own tokens. Descriptors use `id`.
 *
 * @group Bind
 *
 * @template T - Injectable type.
 *
 * @param entry - Service class or descriptor.
 * @returns Token used for container resolution.
 *
 * @example
 * ```typescript
 * import { getEntryToken } from "@wirestate/core";
 *
 * class UserService {}
 *
 * const classToken = getEntryToken(UserService);
 * const configToken = getEntryToken({ id: "CONFIG", value: { retries: 2 } });
 * ```
 */
export function getEntryToken<T extends object = object>(entry: Newable<T> | InjectableDescriptor): ServiceIdentifier {
  return typeof entry === "function" ? entry : entry.id;
}
