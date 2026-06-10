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
export interface BindingMap extends Map<Identifier<unknown>, BindingDescriptor<unknown>> {
  get<T>(key: Identifier<T>): BindingDescriptor<T> | undefined;
  set<T>(key: Identifier<T>, value: BindingDescriptor<T>): this;
}

/**
 * Descriptor-keyed cache of constructed singleton values.
 *
 * @internal
 */
export interface InstanceMap extends Map<AnyBinding, unknown> {
  get<T>(key: BindingDescriptor<T>): T | undefined;
  set<T>(key: BindingDescriptor<T>, value: T): this;
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
