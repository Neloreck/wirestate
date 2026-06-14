import type { BindingDescriptor, ServiceToken } from "../binding/binding";
import type { Optional } from "../types/general";

/**
 * Token-keyed storage of registered binding descriptors.
 *
 * @internal
 */
export interface BindingMap extends Map<ServiceToken, BindingDescriptor> {
  get<T>(key: ServiceToken<T>): Optional<BindingDescriptor<T>>;
  set<T>(key: ServiceToken<T>, value: BindingDescriptor<T>): this;
}

/**
 * Descriptor-keyed cache of constructed singleton values.
 *
 * @internal
 */
export interface InstanceMap extends Map<BindingDescriptor, unknown> {
  get<T>(key: BindingDescriptor<T>): Optional<T>;
  set<T>(key: BindingDescriptor<T>, value: T): this;
}

/**
 * One container-owned constructed value, recorded in creation order for deactivation.
 *
 * @internal
 */
export interface ActivationRecord {
  token: ServiceToken;
  binding: BindingDescriptor;
  instance: unknown;
}
