import { ServiceIdentifier, bindingTypeValues, bindingScopeValues, Newable } from "inversify";

/**
 * Inversify binding strategy types.
 *
 * @group Bind
 */
export type BindingType = (typeof bindingTypeValues)[keyof typeof bindingTypeValues];

/**
 * Inversify scope strategy types.
 *
 * @group Bind
 */
export type ScopeBindingType = (typeof bindingScopeValues)[keyof typeof bindingScopeValues];

/**
 * Represents descriptor used by wirestate bind/provision APIs to describe how one injectable is resolved.
 *
 * @remarks
 * This interface bridges standard Inversify binding options with Wirestate's simplified registration API.
 * It is used by {@link bindConstant}, {@link bindDynamicValue}, and {@link bindEntry}.
 *
 * @group Bind
 *
 * @template T - Service type resolved from container by {@link id} or returned by {@link factory}.
 * @template V - Value type used by constant/value-style bindings via {@link value}.
 *
 * @example
 * ```typescript
 * const descriptor: InjectableDescriptor<UserRepo> = {
 *   id: UserRepo,
 *   scopeBindingType: "Singleton"
 * };
 * ```
 */
export interface InjectableDescriptor<T = unknown, V = unknown> {
  /**
   * Inversify binding strategy.
   *
   * @remarks
   * Example values: `ConstantValue`, `DynamicValue`, `Factory`, `Provider`.
   */
  readonly bindingType?: BindingType;

  /**
   * Factory function used by dynamic value bindings.
   *
   * @remarks
   * Called by the {@link Container} to create a service instance of type T.
   */
  readonly factory?: () => T;

  /**
   * Unique service token used by Inversify to locate the injectable binding.
   *
   * @remarks
   * Accepts class constructor, symbol, or string service identifier.
   */
  readonly id: ServiceIdentifier<T>;

  /**
   * Inversify scope strategy for created instances.
   *
   * @remarks
   * Example values: `Singleton`, `Transient`, `Request`.
   */
  readonly scopeBindingType?: ScopeBindingType;

  /**
   * Prebuilt value for value-based bindings.
   *
   * @remarks
   * Used when binding mode expects a direct value instance (e.g., constant values).
   */
  readonly value?: V;
}

/**
 * Readonly list of entries accepted by Wirestate registration APIs.
 *
 * @remarks
 * Each item can be either a service class constructor (`Newable<object>`) or
 * a fully configured {@link InjectableDescriptor}.
 *
 * @group Bind
 */
export type InjectableEntries = ReadonlyArray<Newable<object> | InjectableDescriptor>;
