import { BindingType as BindingTypeValues, BindingScope as BindingScopeValues, Newable, Identifier } from "../alias";
import type { Container } from "../base";

/**
 * Identifier for one provider provision cycle of a service instance.
 *
 * @remarks
 * IDs are unique only within a single service instance. Use the value passed to
 * `@OnProvision` and `@OnDeprovision` with
 * `WireStatus.for(instance).provisionId` to ignore async work from an older
 * provision cycle.
 *
 * @group Container
 */
export type ProvisionId = number;

/**
 * Binding strategy name.
 *
 * @group Bind
 */
export type BindingType = keyof typeof BindingTypeValues;

/**
 * Binding lifetime scope name.
 *
 * @group Bind
 */
export type BindingScope = keyof typeof BindingScopeValues;

/**
 * Describes a static value binding.
 *
 * @group Bind
 */
export interface ValueBindingDescriptor<T = unknown> {
  /**
   * Binding strategy.
   */
  readonly type?: "Value";

  /**
   * Lifetime scope for the value.
   *
   * @remarks
   * Values can only be singleton-scoped.
   */
  readonly scope?: "Singleton";

  /**
   * Token used to resolve the binding.
   */
  readonly token: Identifier<T>;

  /**
   * Value to bind.
   */
  readonly value: T;
}

/**
 * Describes a factory binding.
 *
 * @group Bind
 */
export interface FactoryBindingDescriptor<T = unknown> {
  /**
   * Binding strategy.
   */
  readonly type: "Factory";

  /**
   * Factory used to produce the value at resolution time.
   */
  readonly factory: (container: Container) => T;

  /**
   * Lifetime scope for created values.
   */
  readonly scope?: BindingScope;

  /**
   * Token used to resolve the binding.
   */
  readonly token: Identifier<T>;
}

/**
 * Describes a class binding behind a custom token.
 *
 * @group Bind
 */
export interface InstanceBindingDescriptor<T extends object = object> {
  /**
   * Binding strategy.
   */
  readonly type: "Instance";

  /**
   * Token used to resolve the instance.
   */
  readonly token: Identifier<T>;

  /**
   * Service constructor to bind.
   */
  readonly value: Newable<T>;
}

/**
 * Describes one binding descriptor.
 *
 * @remarks
 * `BindingDescriptor` is a union of the specific descriptor shapes accepted by
 * {@link bind}. Use descriptors when a class token is not enough: values,
 * factories, or a class behind a custom token.
 *
 * @group Bind
 *
 * @template T - Resolved value type.
 *
 * @example
 * ```typescript
 * import { BindingType, BindingDescriptor } from "@wirestate/core";
 *
 * const API_URL = Symbol("API_URL");
 *
 * const descriptor: BindingDescriptor<string> = {
 *   token: API_URL,
 *   type: BindingType.Value,
 *   value: "https://api.example.com",
 * };
 * ```
 */
export type BindingDescriptor<T = unknown> =
  | ValueBindingDescriptor<T>
  | FactoryBindingDescriptor<T>
  | (T extends object ? InstanceBindingDescriptor<T> : InstanceBindingDescriptor);

/**
 * Represents a single binding accepted by Wirestate registration APIs.
 *
 * @remarks
 * A binding is either a class {@link Newable} constructor or a {@link BindingDescriptor}
 * for values, factories, or custom-token class bindings.
 *
 * @group Bind
 */
export type Binding<T extends object = object> = Newable<T> | BindingDescriptor;

/**
 * Represents bindings accepted by Wirestate registration APIs.
 *
 * @remarks
 * Each item is either a class reference or an {@link BindingDescriptor}.
 *
 * @group Bind
 */
export type Bindings = ReadonlyArray<Binding>;
