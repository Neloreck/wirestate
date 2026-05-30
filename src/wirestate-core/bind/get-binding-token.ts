import { Newable, ServiceIdentifier } from "../alias";
import { BindingDescriptor } from "../types/provision";

/**
 * Returns the token for a binding.
 *
 * @remarks
 * Classes are their own tokens. Descriptors use `token`.
 *
 * @group Bind
 *
 * @template T - Injectable type.
 *
 * @param binding - Service class or descriptor.
 * @returns Token used for container resolution.
 *
 * @example
 * ```typescript
 * import { getBindingToken } from "@wirestate/core";
 *
 * class UserService {}
 *
 * const classToken = getBindingToken(UserService);
 * const configToken = getBindingToken({ token: "CONFIG", value: { retries: 2 } });
 * ```
 */
export function getBindingToken<T extends object = object>(binding: Newable<T> | BindingDescriptor): ServiceIdentifier {
  return typeof binding === "function" ? binding : binding.token;
}
