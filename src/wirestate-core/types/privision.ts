import { ServiceIdentifier, bindingTypeValues, bindingScopeValues } from "inversify";

/**
 * @group bind
 */
export type BindingType = (typeof bindingTypeValues)[keyof typeof bindingTypeValues];

/**
 * @group bind
 */
export type ScopeBindingType = (typeof bindingScopeValues)[keyof typeof bindingScopeValues];

/**
 * Descriptor used by wirestate bind/provision APIs to describe how one injectable is resolved.
 *
 * @group bind
 *
 * @template T Service type resolved from container by {@link id} or returned by {@link factory}.
 * @template V Value type used by constant/value-style bindings via {@link value}.
 */
export interface InjectableDescriptor<T = unknown, V = unknown> {
  /**
   * Inversify binding strategy.
   * Example values: `ConstantValue`, `DynamicValue`, `Factory`, `Provider`.
   */
  bindingType?: BindingType;

  /**
   * Factory function used by dynamic value bindings.
   * Called by container to create service instance of type T.
   */
  factory?: () => T;

  /**
   * Unique service token used by Inversify to locate injectable binding.
   * Accepts class constructor, symbol, or string service identifier.
   */
  id: ServiceIdentifier<T>;

  /**
   * Inversify scope strategy for created instances.
   * Example values: `Singleton`, `Transient`, `Request`.
   */
  scopeBindingType?: ScopeBindingType;

  /**
   * Prebuilt value for value-based bindings.
   * Used when binding mode expects direct value instance.
   */
  value?: V;
}
