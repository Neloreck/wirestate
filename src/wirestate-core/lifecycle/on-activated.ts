import {
  createSingleMethodDecoratorDescriptor,
  SingleMethodDecorator,
} from "../metadata/metadata-single-method-decorator";
import { Maybe } from "../types/general";

import { ACTIVATED_HANDLER_METADATA, ACTIVATED_METADATA_KEY } from "./lifecycle-registry";

const { decorator, getMetadata } = createSingleMethodDecoratorDescriptor({
  registry: ACTIVATED_HANDLER_METADATA,
  metadataKey: ACTIVATED_METADATA_KEY,
  name: "OnActivated",
  duplicateMessage: (className) => `Only one @OnActivated method can be declared on '${className}'.`,
  hierarchyMessage: (className) =>
    `Only one @OnActivated method can be declared across class hierarchy for '${className}'.`,
});

/**
 * Runs an instance method after container activation.
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
 * import { Injectable, OnActivated } from "@wirestate/core";
 *
 * @Injectable()
 * class FeedService {
 *   @OnActivated()
 *   public onActivated(): void {
 *     this.initializeFromSeed();
 *   }
 * }
 * ```
 */
export function OnActivated(): SingleMethodDecorator {
  return decorator();
}

/**
 * Retrieves the method decorated with {@link OnActivated} by traversing the prototype chain.
 *
 * @remarks
 * A class hierarchy may declare one activation hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Lifecycle
 * @internal
 *
 * @param instance - The instance to scan for activation handlers.
 * @returns The method name (string or symbol), or `null` when no hook exists.
 *
 * @example
 * ```typescript
 * const method = getActivatedHandlerMetadata(myService);
 * method && (myService as any)[method]();
 * ```
 */
export function getActivatedHandlerMetadata(instance: object): Maybe<string | symbol> {
  return getMetadata(instance);
}
