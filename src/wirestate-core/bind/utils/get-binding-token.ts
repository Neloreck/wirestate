import { Newable, Identifier } from "../../alias";
import { BindingDescriptor } from "../../types/provision";

/**
 * Returns the token for a binding.
 *
 * @remarks
 * Classes are their own tokens. Descriptors use `token`.
 *
 * @group Bind
 * @internal
 *
 * @template T - Injectable type.
 *
 * @param binding - Service class or descriptor.
 * @returns Token used for container resolution.
 */
export function getBindingToken<T extends object = object>(binding: Newable<T> | BindingDescriptor): Identifier {
  return typeof binding === "function" ? binding : binding.token;
}
