import type { ContainerKernel } from "../container/container-kernel";
import type { Newable } from "../utils/class-like";

import type { Identifier } from "./tokens";

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
  readonly token: Identifier<T>;

  /**
   * Value to bind.
   */
  readonly value: T;
}

/**
 * Describes a class binding behind a custom token,
 * which may be the same class as the token, or a subclass.
 *
 * @group Bind
 */
export interface InstanceBindingDescriptor<T = unknown> {
  /**
   * Binding strategy.
   */
  readonly type: "Instance";

  /**
   * Token used to resolve the instance.
   */
  readonly token: Identifier<T>;

  /**
   * Service constructor to bind. Instances are singletons.
   */
  readonly value: Newable<NoInfer<T>>;

  /**
   * Skip `@OnActivated` and `@OnDeactivation` hooks for this binding.
   * Message handlers and lifecycle status are wired either way.
   *
   * @default `false`
   */
  readonly skipActivationHooks?: boolean;
}

/**
 * Describes a factory binding whose value is lazily produced by a factory function.
 *
 * @group Bind
 */
export interface FactoryBindingDescriptor<T = unknown> {
  /**
   * Binding strategy.
   */
  readonly type?: "Factory";

  /**
   * Token used to resolve the binding.
   */
  readonly token: Identifier<T>;

  /**
   * Factory used to produce the value at resolution time.
   * Runs inside the injection context, so `inject()` works in its body.
   */
  readonly factory: (container: ContainerKernel) => NoInfer<T>;

  /**
   * Lifetime scope for created values.
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Binding<T extends object = object> = Newable<T> | BindingDescriptor<any>;

/**
 * Represents bindings accepted by Wirestate registration APIs.
 *
 * @remarks
 * Each item is either a class reference or an {@link BindingDescriptor}.
 *
 * @group Bind
 */
export type Bindings = ReadonlyArray<Binding>;
