import type { DynamicValueBuilder, MapToResolvedValueInjectOptions, ResolutionContext } from "inversify";

import {
  BindingType as BindingTypeValues,
  ScopeBindingType as ScopeBindingTypeValues,
  type Newable,
  type ServiceIdentifier,
} from "../alias";

/**
 * Inversify binding strategy name.
 *
 * @group Bind
 */
export type BindingType = (typeof BindingTypeValues)[keyof typeof BindingTypeValues];

/**
 * Inversify lifetime scope name.
 *
 * @group Bind
 */
export type ScopeBindingType = (typeof ScopeBindingTypeValues)[keyof typeof ScopeBindingTypeValues];

/**
 * Describes a fixed value binding.
 *
 * @group Bind
 */
export interface ConstantValueBindingDescriptor<T = unknown> {
  /**
   * Binding strategy.
   *
   * @default `BindingType.ConstantValue`
   */
  readonly bindingType?: typeof BindingTypeValues.ConstantValue;

  /**
   * Token used to resolve the binding.
   */
  readonly id: ServiceIdentifier<T>;

  /**
   * Fixed value to bind.
   */
  readonly value: T;
}

/**
 * Describes a dynamic value binding.
 *
 * @group Bind
 */
export interface DynamicValueBindingDescriptor<T = unknown> {
  /**
   * Binding strategy.
   */
  readonly bindingType: typeof BindingTypeValues.DynamicValue;

  /**
   * Factory used to produce the value at resolution time.
   */
  readonly factory: DynamicValueBuilder<T>;

  /**
   * Token used to resolve the binding.
   */
  readonly id: ServiceIdentifier<T>;

  /**
   * Lifetime scope for created values.
   */
  readonly scopeBindingType?: ScopeBindingType;

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
  readonly bindingType: typeof BindingTypeValues.Factory;

  /**
   * Factory creator passed to Inversify.
   */
  readonly factory: (context: ResolutionContext) => T | Promise<T>;

  /**
   * Token used to resolve the factory.
   */
  readonly id: ServiceIdentifier<T>;
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
  readonly bindingType: typeof BindingTypeValues.Instance;

  /**
   * Token used to resolve the service.
   */
  readonly id: ServiceIdentifier<T>;

  /**
   * Service constructor to bind.
   */
  readonly value: Newable<T>;
}

/**
 * Describes a resolved value binding.
 *
 * @group Bind
 */
export interface ResolvedValueBindingDescriptor<T = unknown, TArgs extends Array<unknown> = Array<unknown>> {
  /**
   * Binding strategy.
   */
  readonly bindingType: typeof BindingTypeValues.ResolvedValue;

  /**
   * Factory called by Inversify with injected arguments.
   */
  readonly factory: (...args: TArgs) => T | Promise<T>;

  /**
   * Token used to resolve the binding.
   */
  readonly id: ServiceIdentifier<T>;

  /**
   * Injection options for factory arguments.
   */
  readonly injectOptions?: MapToResolvedValueInjectOptions<TArgs>;

  /**
   * Lifetime scope for created values.
   */
  readonly scopeBindingType?: ScopeBindingType;
}

/**
 * Describes a binding that redirects one token to another service token.
 *
 * @group Bind
 */
export interface ServiceRedirectionBindingDescriptor<T = unknown> {
  /**
   * Binding strategy.
   */
  readonly bindingType: typeof BindingTypeValues.ServiceRedirection;

  /**
   * Token used to resolve the redirected binding.
   */
  readonly id: ServiceIdentifier<T>;

  /**
   * Existing service token to redirect to.
   */
  readonly service: ServiceIdentifier<T>;
}

/**
 * Represents one container binding.
 *
 * @remarks
 * Use descriptors when a class token is not enough: constants, factories,
 * resolved values, service redirection, or a class behind a custom token.
 *
 * @group Bind
 *
 * @template T - Resolved value type.
 * @template V - Descriptor value type.
 * @template TArgs - Resolved value factory argument tuple.
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
export interface BindingDescriptor<T = unknown, V = unknown, TArgs extends Array<unknown> = Array<unknown>> {
  /**
   * Binding strategy.
   */
  readonly bindingType?: BindingType;

  /**
   * Factory used by dynamic, factory, and resolved value bindings.
   */
  readonly factory?:
    | DynamicValueBuilder<T>
    | ((context: ResolutionContext) => T | Promise<T>)
    | ((...args: TArgs) => T | Promise<T>);

  /**
   * Token used to resolve the binding.
   */
  readonly id: ServiceIdentifier<T>;

  /**
   * Injection options for resolved value factory arguments.
   */
  readonly injectOptions?: MapToResolvedValueInjectOptions<TArgs>;

  /**
   * Existing service token for service redirection bindings.
   */
  readonly service?: ServiceIdentifier<T>;

  /**
   * Lifetime scope for binding types that support scopes.
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
 * factories, resolved values, service redirection, or custom-token class bindings.
 *
 * @group Bind
 */
export type Binding<T extends object = object> = Newable<T> | BindingDescriptor;

/**
 * Represents bindings accepted by Wirestate registration APIs.
 *
 * @remarks
 * Each item is either a service class or an {@link BindingDescriptor}.
 *
 * @group Bind
 */
export type Bindings = ReadonlyArray<Binding>;
