import { ReactiveControllerHost } from "@lit/reactive-element";

import { ContainerProviderController, ContainerProviderControllerOptions } from "./container-provider-controller";

/**
 * Represents options for the {@link useContainerProvision} hook.
 *
 * @group Provision
 */
export type UseContainerProvisionOptions = ContainerProviderControllerOptions;

/**
 * Hook that provides a container to the host element and its children.
 *
 * @remarks
 * Pass `container` to expose an external `Container` without taking
 * ownership. Pass `options` to create a managed container during
 * construction, activate configured entries on connect, destroy it on
 * disconnect, and recreate it on reconnect.
 *
 * @group Provision
 *
 * @param host - The host element.
 * @param options - Provisioning options.
 * @param options.container - External container instance to provide.
 * @param options.options - Managed container creation options.
 * @returns An instance of {@link ContainerProviderController}.
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   private container: ContainerProviderController = useContainerProvision(this, {
 *     options: {
 *       entries: [LoggerService],
 *       activate: [LoggerService],
 *     },
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   private container: ContainerProviderController = useContainerProvision(this, { container: container });
 * }
 * ```
 */
export function useContainerProvision<E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  options: UseContainerProvisionOptions
): ContainerProviderController<E> {
  return new ContainerProviderController(host, options);
}
