import {
  createSingleMethodDecoratorDescriptor,
  type LifecycleDecorator,
} from "../metadata/metadata-single-method-decorator";
import { type Optional } from "../types/general";

const { decorator, getMetadata } = createSingleMethodDecoratorDescriptor({
  name: "OnActivation",
  registry: new WeakMap(),
  metadataKey: Symbol("@wirestate/core/lifecycle/activation"),
  duplicateMessage: (className) => `Only one @OnActivation method can be declared on '${className}'.`,
  hierarchyMessage: (className) =>
    `Only one @OnActivation method can be declared across class hierarchy for '${className}'.`,
});

/**
 * Runs an instance method after container activation completes.
 *
 * @remarks
 * Activation happens the first time the singleton instance is resolved.
 *
 * Use it for cheap resolution-time initialization that does not open resources.
 * Prefer `@OnProvision` for subscriptions, timers, sockets, observers, and
 * async work that needs cleanup. A class hierarchy may have one activation
 * hook name.
 *
 * @group Lifecycle
 *
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnActivation } from "@wirestate/core";
 *
 * @Injectable()
 * class FeedService {
 *   @OnActivation()
 *   public onActivation(): void {
 *     this.initializeDefaults();
 *   }
 * }
 * ```
 */
export function OnActivation(): LifecycleDecorator {
  return decorator();
}

/**
 * Retrieves the method decorated with {@link OnActivation} by traversing the prototype chain.
 *
 * @remarks
 * A class hierarchy may declare one activation hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name.
 * Declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Lifecycle
 * @internal
 *
 * @param instance - The instance to scan for activation handlers.
 * @returns The method name (string or symbol), or `undefined` when no hook exists.
 *
 * @example
 * ```typescript
 * const method = getActivationHandlerMetadata(myService);
 * method && (myService as any)[method]();
 * ```
 */
export function getActivationHandlerMetadata(instance: object): Optional<string | symbol> {
  return getMetadata(instance);
}
