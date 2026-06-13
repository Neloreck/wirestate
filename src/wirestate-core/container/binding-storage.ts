import type { BindingDescriptor, Identifier } from "../binding/binding";
import type { Definable } from "../types/general";

/**
 * Token-keyed storage of registered binding descriptors.
 *
 * @internal
 */
export interface BindingMap extends Map<Identifier, BindingDescriptor> {
  get<T>(key: Identifier<T>): Definable<BindingDescriptor<T>>;
  set<T>(key: Identifier<T>, value: BindingDescriptor<T>): this;
}

/**
 * Descriptor-keyed cache of constructed singleton values.
 *
 * @internal
 */
export interface InstanceMap extends Map<BindingDescriptor, unknown> {
  get<T>(key: BindingDescriptor<T>): Definable<T>;
  set<T>(key: BindingDescriptor<T>, value: T): this;
}

/**
 * One container-owned constructed value, recorded in creation order for deactivation.
 *
 * @internal
 */
export interface ActivationRecord {
  token: Identifier;
  binding: BindingDescriptor;
  instance: unknown;
  /**
   * Cleanup callbacks collected while the value was activated,
   * invoked when the value is deactivated or its activation rolls back.
   */
  disposers: Array<() => void>;
}
