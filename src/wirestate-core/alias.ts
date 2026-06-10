/**
 * Wirestate DI container and injection primitives.
 *
 * @group Container
 */
export { Container, InjectionToken, inject, NoBindingFoundError, CircularDependencyError } from "./base";
export { Identifier } from "./base";

/**
 * Lifetime scope names accepted by binding descriptors.
 *
 * @remarks
 * `Singleton` caches one value per container, `Transient` constructs a new
 * value on every resolution.
 *
 * @group Bind
 */
export { BindingScope } from "./base";

/**
 * @group Bind
 */
export { Injectable, isInjectable } from "./base";

/**
 * Constructable class reference.
 *
 * @group Container
 */
export { Newable } from "./base";

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
