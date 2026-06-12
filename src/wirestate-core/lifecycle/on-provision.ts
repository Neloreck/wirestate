import { PROVISION_HANDLER_METADATA, PROVISION_METADATA_KEY } from "../metadata/metadata-registry";
import {
  createSingleMethodDecoratorDescriptor,
  SingleMethodDecorator,
} from "../metadata/metadata-single-method-decorator";
import { Maybe } from "../types/general";

const { decorator, getMetadata } = createSingleMethodDecoratorDescriptor({
  name: "OnProvision",
  registry: PROVISION_HANDLER_METADATA,
  metadataKey: PROVISION_METADATA_KEY,
  duplicateMessage: (className) => `Only one @OnProvision method can be declared on provider '${className}'.`,
  hierarchyMessage: (className) =>
    `Only one @OnProvision method can be declared across provider hierarchy '${className}'.`,
});

/**
 * Runs when a framework provider exposes the container.
 *
 * @remarks
 * React and Lit providers call this when a container enters a UI subtree.
 * This is provider lifetime, not instance lifetime.
 *
 * Use it for subscriptions, timers, sockets, observers, provider-scoped async
 * work, or any resource that should be cleaned up when the provider releases
 * the container. A class hierarchy may have one provision hook name.
 *
 * @group Lifecycle
 *
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnProvision } from "@wirestate/core";
 *
 * @Injectable()
 * class PanelService {
 *   @OnProvision()
 *   public onProvision(): void {
 *     this.startPolling();
 *     this.connect();
 *   }
 * }
 * ```
 */
export function OnProvision(): SingleMethodDecorator {
  return decorator();
}

/**
 * Retrieves the method decorated with {@link OnProvision} by traversing the prototype chain.
 *
 * @remarks
 * A class hierarchy may declare one provision hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Lifecycle
 * @internal
 *
 * @param instance - The instance to scan for provision handlers.
 * @returns The method name, or `null` when no hook exists.
 */
export function getProvisionHandlerMetadata(instance: object): Maybe<string | symbol> {
  return getMetadata(instance);
}
