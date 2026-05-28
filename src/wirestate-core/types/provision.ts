import { ServiceIdentifier, bindingTypeValues, bindingScopeValues, Newable } from "../alias";

/**
 * Inversify binding strategy name.
 *
 * @group Bind
 */
export type BindingType = (typeof bindingTypeValues)[keyof typeof bindingTypeValues];

/**
 * Inversify lifetime scope name.
 *
 * @group Bind
 */
export type ScopeBindingType = (typeof bindingScopeValues)[keyof typeof bindingScopeValues];

/**
 * Represents one container binding.
 *
 * @remarks
 * Use descriptors when a class token is not enough: constants, factories, or a
 * class behind a custom token.
 *
 * @group Bind
 *
 * @template T - Resolved value type.
 * @template V - Descriptor value type.
 *
 * @example
 * ```typescript
 * import { BindingType, BindingDescriptor } from "@wirestate/core";
 *
 * const API_URL = Symbol("API_URL");
 *
 * const descriptor: BindingDescriptor<string> = {
 *   id: API_URL,
 *   bindingType: BindingType.ConstantValue,
 *   value: "https://api.example.com",
 * };
 * ```
 */
export interface BindingDescriptor<T = unknown, V = unknown> {
  /**
   * Binding strategy.
   */
  readonly bindingType?: BindingType;

  /**
   * Factory used by dynamic value bindings.
   */
  readonly factory?: () => T;

  /**
   * Token used to resolve the binding.
   */
  readonly id: ServiceIdentifier<T>;

  /**
   * Lifetime scope for created values.
   */
  readonly scopeBindingType?: ScopeBindingType;

  /**
   * Fixed value or class constructor, depending on binding type.
   */
  readonly value?: V;
}

/**
 * Represents a single binding accepted by Wirestate registration APIs.
 *
 * @remarks
 * A binding is either a service class constructor or a descriptor for constants,
 * factories, or custom-token class bindings.
 *
 * @group Bind
 */
export type Binding = Newable<object> | BindingDescriptor;

/**
 * Represents bindings accepted by Wirestate registration APIs.
 *
 * @remarks
 * Each item is either a service class or an {@link BindingDescriptor}.
 *
 * @group Bind
 */
export type Bindings = ReadonlyArray<Binding>;
