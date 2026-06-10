import type { Container } from "../container/container";
import type { Identifier } from "../tokens";
import type { Newable } from "../utils/class-like";

/**
 * Lifetime scope names accepted by binding descriptors:
 *
 * - `Singleton` (default): the value is constructed once and reused for every resolution.
 * - `Transient`: a new value is constructed for every resolution and never cached.
 */
export const BindingScope = {
  Singleton: "Singleton",
  Transient: "Transient",
} as const;

/**
 * Lifetime scope of a binding descriptor.
 */
export type BindingScope = keyof typeof BindingScope;

/**
 * A binding descriptor declares a token together with a construction strategy.
 */
export type BindingDescriptor<T> =
  | ValueBindingDescriptor<T>
  | InstanceBindingDescriptor<T>
  | FactoryBindingDescriptor<T>;

/**
 * A handler invoked right after a binding constructs a value.
 * When a non-`undefined` value is returned, it replaces the constructed value.
 */
export type BindingActivationHandler<T> = (instance: T, container: Container) => T | void;

/**
 * A handler invoked for each container-owned value right before its binding is unbound.
 */
export type BindingDeactivationHandler<T> = (instance: T, container: Container) => void;

/**
 * Binds a static value to a token. Values are always singletons.
 */
export interface ValueBindingDescriptor<T> {
  token: Identifier<T>;
  type?: "Value";
  value: T;
  onActivated?: BindingActivationHandler<NoInfer<T>>;
  onDeactivated?: BindingDeactivationHandler<NoInfer<T>>;
}

/**
 * Binds a class constructor behind a token,
 * which may be the same class as the token, or a subclass.
 */
export interface InstanceBindingDescriptor<T> {
  token: Identifier<T>;
  type: "Instance";
  value: Newable<NoInfer<T>>;
  scope?: BindingScope;
  onActivated?: BindingActivationHandler<NoInfer<T>>;
  onDeactivated?: BindingDeactivationHandler<NoInfer<T>>;
}

/**
 * Binds a value which is lazily produced by a factory function.
 */
export interface FactoryBindingDescriptor<T> {
  token: Identifier<T>;
  type?: "Factory";
  factory: (container: Container) => NoInfer<T>;
  scope?: BindingScope;
  onActivated?: BindingActivationHandler<NoInfer<T>>;
  onDeactivated?: BindingDeactivationHandler<NoInfer<T>>;
}
