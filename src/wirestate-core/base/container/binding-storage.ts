import type { BindingDescriptor } from "../binding/binding";
import type { Identifier } from "../tokens";

/**
 * Lifecycle hook parameters make `BindingDescriptor<T>` invariant in `T`,
 * so internal storage is keyed by an any-typed descriptor.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyBinding = BindingDescriptor<any>;

/**
 * Token-keyed storage of registered binding descriptors.
 *
 * @internal
 */
export interface BindingMap extends Map<Identifier<unknown>, Array<BindingDescriptor<unknown>>> {
  get<T>(key: Identifier<T>): Array<BindingDescriptor<T>> | undefined;

  set<T>(key: Identifier<T>, value: Array<BindingDescriptor<T>>): this;
}

/**
 * Descriptor-keyed cache of constructed singleton values.
 *
 * @internal
 */
export interface InstanceMap extends Map<AnyBinding, Array<unknown>> {
  get<T>(key: BindingDescriptor<T>): Array<T> | undefined;

  set<T>(key: BindingDescriptor<T>, value: Array<T>): this;
}

/**
 * One container-owned constructed value, recorded in creation order for deactivation.
 *
 * @internal
 */
export interface ActivationRecord {
  token: Identifier<unknown>;
  binding: AnyBinding;
  instance: unknown;
}
