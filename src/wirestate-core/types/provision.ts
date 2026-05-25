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
 * Represents one container entry.
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
 * import { BindingType, InjectableDescriptor } from "@wirestate/core";
 *
 * const API_URL = Symbol("API_URL");
 *
 * const descriptor: InjectableDescriptor<string> = {
 *   id: API_URL,
 *   bindingType: BindingType.ConstantValue,
 *   value: "https://api.example.com",
 * };
 * ```
 */
export interface InjectableDescriptor<T = unknown, V = unknown> {
  /**
   * Binding strategy.
   */
  readonly bindingType?: BindingType;

  /**
   * Factory used by dynamic value bindings.
   */
  readonly factory?: () => T;

  /**
   * Token used to resolve the entry.
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
 * Represents entries accepted by Wirestate registration APIs.
 *
 * @remarks
 * Each item is either a service class or an {@link InjectableDescriptor}.
 *
 * @group Bind
 */
export type InjectableEntries = ReadonlyArray<Newable<object> | InjectableDescriptor>;
