import { createSingleMethodDecoratorDescriptor } from "../../metadata/single-method-lifecycle-decorator";
import { DEACTIVATION_HANDLER_METADATA } from "../../registry";
import { Maybe } from "../../types/general";

const { decorator, getMetadata } = createSingleMethodDecoratorDescriptor({
  registry: DEACTIVATION_HANDLER_METADATA,
  name: "OnDeactivation",
  duplicateMessage: (className) => `Only one @OnDeactivation method can be declared on '${className}'.`,
  hierarchyMessage: (className) =>
    `Only one @OnDeactivation method can be declared across class hierarchy for '${className}'.`,
});

/**
 * Runs an instance method during container deactivation.
 *
 * @remarks
 * Deactivation happens when the container unbinds or disposes the instance.
 *
 * Use it for container-disposal cleanup. Prefer `@OnDeprovision` for work
 * started by provider ownership, such as subscriptions, timers, sockets, and
 * observers. A class hierarchy may have one deactivation hook name.
 *
 * @group Lifecycle
 *
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnDeactivation } from "@wirestate/core";
 *
 * @Injectable()
 * class FeedService {
 *   @OnDeactivation()
 *   public onDeactivation(): void {
 *     this.disposeResources();
 *   }
 * }
 * ```
 */
export function OnDeactivation(): MethodDecorator {
  return decorator();
}

/**
 * Retrieves the method decorated with {@link OnDeactivation} by traversing the prototype chain.
 *
 * @remarks
 * A class hierarchy may declare one deactivation hook name. Subclasses can
 * override a decorated base method and may redecorate that same method name;
 * declaring a different decorated method in the same hierarchy is a validation
 * error.
 *
 * @group Lifecycle
 * @internal
 *
 * @param instance - The instance to scan for deactivation handlers.
 * @returns The method name (string or symbol), or `null` when no hook exists.
 *
 * @example
 * ```typescript
 * const method = getDeactivationHandlerMetadata(myService);
 * method && (myService as any)[method]();
 * ```
 */
export function getDeactivationHandlerMetadata(instance: object): Maybe<string | symbol> {
  return getMetadata(instance);
}
