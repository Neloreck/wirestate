import type { ContainerKernel } from "../container/container-kernel";
import type { AbstractClass, Newable } from "../types/general";

import type { InjectionToken } from "./binding-tokens";

/**
 * Binding strategy names accepted by binding descriptors.
 *
 * @group Bind
 */
export const BindingType = {
  Value: "Value",
  Instance: "Instance",
  Factory: "Factory",
} as const;

/**
 * Binding strategy name.
 *
 * @group Bind
 */
export type BindingTypeValue = keyof typeof BindingType;

/**
 * Lifetime scope names accepted by binding descriptors:
 *
 * - `Singleton` (default): the value is constructed once and reused for every resolution.
 * - `Transient`: a new value is constructed for every resolution and never cached.
 *
 * @group Bind
 */
export const BindingScope = {
  Singleton: "Singleton",
  Transient: "Transient",
} as const;

/**
 * Binding lifetime scope name.
 *
 * @group Bind
 */
export type BindingScopeValue = keyof typeof BindingScope;

/**
 * A service token is a reference to a service in the dependency injection (DI) container:
 * class constructor, abstract class, string, symbol, or {@link InjectionToken}.
 * When obtaining a service from the container, you should use its service token.
 */
export type ServiceToken<T = unknown> = Newable<T> | AbstractClass<T> | string | symbol | InjectionToken<T>;

/**
 * Describes a static value binding. Values are always singletons.
 *
 * @group Bind
 */
export interface ValueBindingDescriptor<T = unknown> {
  /**
   * Binding strategy.
   */
  readonly type?: "Value";

  /**
   * Token used to resolve the binding.
   */
  readonly token: ServiceToken<T>;

  /**
   * Value to bind.
   */
  readonly value: T;
}

/**
 * Describes a token-bound service instance constructed from an injectable class.
 *
 * @remarks
 * Use an instance binding when the token callers resolve should be explicit:
 * an interface-shaped {@link InjectionToken}, an abstract class, a base class,
 * or a class token mapped to a subclass implementation. A bare class binding is
 * shorthand for an instance binding whose `token` and `value` are the same class.
 *
 * Singleton instance bindings are cached, owned by the container, and wired into
 * service lifecycle, provider lifecycle, and messaging. Transient instance bindings
 * create a fresh instance for every resolution and are not cached or owned.
 * `Container` rejects transient instance classes that declare lifecycle or messaging
 * handlers because those handlers would have no owned lifetime.
 *
 * @group Bind
 *
 * @template T - Instance type resolved for the token.
 */
export interface InstanceBindingDescriptor<T = unknown> {
  /**
   * Binding strategy for injectable class construction.
   */
  readonly type: "Instance";

  /**
   * Token used to resolve the constructed instance.
   */
  readonly token: ServiceToken<T>;

  /**
   * Injectable service constructor used to create the instance.
   *
   * @remarks
   * The constructor must be assignable to the token's resolved type and must be
   * decorated with `@Injectable()`.
   */
  readonly value: Newable<NoInfer<T>>;

  /**
   * Lifetime scope for the instance.
   *
   * @remarks
   * Defaults to `Singleton`: the value is constructed once, cached, and owned by the
   * container with full instance lifecycle. A `Transient` value is constructed fresh on
   * every resolution and is never cached or owned, so its class must declare no wirestate
   * lifecycle or messaging handlers. The container rejects a transient instance class that
   * declares handlers at bind time.
   */
  readonly scope?: BindingScopeValue;
}

/**
 * Describes a token-bound value produced by a factory function.
 *
 * @remarks
 * Use a factory binding when a dependency should be created on first resolution,
 * should read other container bindings while it is created, or should create a fresh
 * value for each resolution with `Transient` scope. Singleton factories are cached
 * after the first resolution. Factory results are not service instances, so service
 * lifecycle decorators and messaging handlers are not wired for the returned value.
 *
 * @group Bind
 *
 * @template T - Value returned by the factory.
 */
export interface FactoryBindingDescriptor<T = unknown> {
  /**
   * Binding strategy. Optional when the descriptor has a `factory` field.
   */
  readonly type?: "Factory";

  /**
   * Token used to resolve the factory result.
   */
  readonly token: ServiceToken<T>;

  /**
   * Creates the value for this token.
   *
   * @remarks
   * Receives the current container and runs inside the injection context, so
   * both `current.get(...)` and `inject(...)` can read other bindings.
   */
  readonly factory: (container: ContainerKernel) => NoInfer<T>;

  /**
   * Lifetime scope for factory results.
   *
   * @remarks
   * Defaults to `Singleton`, which calls the factory once and reuses the result.
   * `Transient` calls the factory on every resolution and does not cache the result.
   */
  readonly scope?: BindingScopeValue;
}

/**
 * Describes one binding descriptor: a token together with a construction strategy.
 *
 * @remarks
 * Descriptors without `type` are treated as `Value` bindings.
 *
 * @group Bind
 *
 * @template T - Resolved value type.
 */
export type BindingDescriptor<T = unknown> =
  | ValueBindingDescriptor<T>
  | InstanceBindingDescriptor<T>
  | FactoryBindingDescriptor<T>;

/**
 * Represents a single binding accepted by Wirestate registration APIs.
 *
 * @remarks
 * A binding is either a class {@link Newable} constructor or a {@link BindingDescriptor}
 * for values, factories, or custom-token class bindings.
 *
 * @group Bind
 */
export type Binding = Newable<object> | BindingDescriptor;
