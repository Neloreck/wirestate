import type { Token } from "./base";

/**
 * Wirestate DI container and injection primitives.
 *
 * @group Container
 */
export { Container, InjectionToken, inject, NoProviderFoundError, CircularDependencyError } from "./base";

/**
 * @group Bind
 */
export { Injectable, isInjectable } from "./metadata/injectable";

/**
 * Token used to register and resolve a service: class constructor, abstract
 * class, string, symbol, or {@link InjectionToken}.
 *
 * @group Container
 */
export type Identifier<TInstance = unknown> = Token<TInstance>;

/**
 * Constructable class reference.
 *
 * @group Container
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Newable<TInstance = unknown> = new (...args: Array<any>) => TInstance;

/**
 * Binding strategy names accepted by binding descriptors.
 *
 * @group Bind
 */
export const BindingType = {
  ConstantValue: "ConstantValue",
  DynamicValue: "DynamicValue",
  Factory: "Factory",
  Instance: "Instance",
  ResolvedValue: "ResolvedValue",
  ServiceRedirection: "ServiceRedirection",
} as const;

/**
 * Lifetime scope names accepted by binding descriptors.
 *
 * @remarks
 * `Singleton` caches one value per container, `Transient` constructs a new
 * value on every resolution.
 *
 * @group Bind
 */
export const BindingScope = {
  Singleton: "Singleton",
  Transient: "Transient",
} as const;
