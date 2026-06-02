import { DynamicValueBuilder, MapToResolvedValueInjectOptions, ResolutionContext } from "inversify";

import { Newable, Identifier } from "../alias";

/**
 * Inversify binding strategy name.
 *
 * @group Bind
 */
export type BindingType =
  | "ConstantValue"
  | "DynamicValue"
  | "Factory"
  | "Instance"
  | "ResolvedValue"
  | "ServiceRedirection";

/**
 * Inversify lifetime scope name.
 *
 * @group Bind
 */
export type BindingScope = "Request" | "Singleton" | "Transient";

/**
 * Describes a constant value binding.
 *
 * @group Bind
 */
export interface ConstantValueBindingDescriptor<T = unknown> {
  /**
   * Binding strategy.
   */
  readonly type?: "ConstantValue";

  /**
   * Lifetime scope for the constant value.
   *
   * @remarks
   * Constant values can only be singleton-scoped.
   */
  readonly scope?: "Singleton";

  /**
   * Token used to resolve the binding.
   */
  readonly token: Identifier<T>;

  /**
   * Constant value to bind.
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
  readonly type: "DynamicValue";

  /**
   * Factory used to produce the value at resolution time.
   */
  readonly factory: DynamicValueBuilder<T>;

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
   * Factory creator passed to Inversify.
   */
  readonly factory: (context: ResolutionContext) => T | Promise<T>;

  /**
   * Token used to resolve the factory.
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
 * Describes a resolved value binding.
 *
 * @group Bind
 */
export interface ResolvedValueBindingDescriptor<T = unknown, TArgs extends Array<unknown> = Array<unknown>> {
  /**
   * Binding strategy.
   */
  readonly type: "ResolvedValue";

  /**
   * Factory called by Inversify with injected arguments.
   */
  readonly factory: (...args: TArgs) => T | Promise<T>;

  /**
   * Injection options for factory arguments.
   */
  readonly injectOptions?: MapToResolvedValueInjectOptions<TArgs>;

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
 * Describes a binding that redirects one token to another service token.
 *
 * @group Bind
 */
export interface ServiceRedirectionBindingDescriptor<T = unknown> {
  /**
   * Binding strategy.
   */
  readonly type: "ServiceRedirection";

  /**
   * Existing service token to redirect to.
   */
  readonly service: Identifier<T>;

  /**
   * Token used to resolve the redirected binding.
   */
  readonly token: Identifier<T>;
}

/**
 * Describes one binding descriptor.
 *
 * @remarks
 * `BindingDescriptor` is a union of the specific descriptor shapes accepted by
 * {@link bind}. Use descriptors when a class token is not enough: constants,
 * factories, resolved values, service redirection, or a class behind a custom
 * token.
 *
 * @group Bind
 *
 * @template T - Resolved value type.
 * @template FA - Resolved value factory argument tuple.
 *
 * @example
 * ```typescript
 * import { BindingType, BindingDescriptor } from "@wirestate/core";
 *
 * const API_URL = Symbol("API_URL");
 *
 * const descriptor: BindingDescriptor<string> = {
 *   token: API_URL,
 *   type: BindingType.ConstantValue,
 *   value: "https://api.example.com",
 * };
 * ```
 */
export type BindingDescriptor<T = unknown, FA extends Array<unknown> = Array<unknown>> =
  | ConstantValueBindingDescriptor<T>
  | DynamicValueBindingDescriptor<T>
  | FactoryBindingDescriptor<T>
  | (T extends object ? InstanceBindingDescriptor<T> : InstanceBindingDescriptor)
  | ResolvedValueBindingDescriptor<T, FA>
  | ServiceRedirectionBindingDescriptor<T>;

/**
 * Represents a single binding accepted by Wirestate registration APIs.
 *
 * @remarks
 * A binding is either a class {@link Newable} constructor or a {@link BindingDescriptor}
 * for constants, factories, resolved values, service redirection, or custom-token class bindings.
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
