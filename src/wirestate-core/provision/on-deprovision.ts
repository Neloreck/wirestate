import {
  createSingleMethodDecoratorDescriptor,
  SingleMethodDecorator,
} from "../metadata/metadata-single-method-decorator";
import { Optional } from "../types/general";

const { decorator, getMetadata } = createSingleMethodDecoratorDescriptor({
  name: "OnDeprovision",
  registry: new WeakMap(),
  metadataKey: Symbol("@wirestate/core/lifecycle/deprovision"),
  duplicateMessage: (className) => `Only one @OnDeprovision method can be declared on provider '${className}'.`,
  hierarchyMessage: (className) =>
    `Only one @OnDeprovision method can be declared across provider hierarchy '${className}'.`,
});

/**
 * Runs before a framework provider stops exposing the container.
 *
 * @remarks
 * React and Lit providers call this when a container leaves a UI subtree.
 * This is provider lifetime, not instance lifetime.
 *
 * Use it to clean up work started by `@OnProvision`. A class hierarchy may
 * have one deprovision hook name.
 *
 * @group Lifecycle
 *
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnDeprovision } from "@wirestate/core";
 *
 * @Injectable()
 * class PanelService {
 *   @OnDeprovision()
 *   public onDeprovision(): void {
 *     this.stopPolling();
 *     this.disconnect();
 *   }
 * }
 * ```
 */
export function OnDeprovision(): SingleMethodDecorator {
  return decorator();
}

/**
 * Retrieves the method decorated with {@link OnDeprovision} by traversing the prototype chain.
 *
 * @remarks
 * A class hierarchy may declare one deprovision hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Lifecycle
 * @internal
 *
 * @param instance - The instance to scan for deprovision handlers.
 * @returns The method name, or `undefined` when no hook exists.
 */
export function getDeprovisionHandlerMetadata(instance: object): Optional<string | symbol> {
  return getMetadata(instance);
}
