import { ReactiveControllerHost } from "@lit/reactive-element";

import { ContainerProvider, ContainerProviderOptions } from "./container-provider";

/**
 * Represents options for {@link useContainerProvision}.
 *
 * @group Provision
 */
export type UseContainerProvisionOptions = ContainerProviderOptions;

/**
 * Hook that provides a container to the host element and its children.
 *
 * @remarks
 * Pass `container` to expose an external `Container` without taking
 * ownership. Pass `config` to create a managed container when the host
 * connects, run provider lifecycle hooks while connected, destroy it on
 * disconnect, and recreate it on reconnect.
 *
 * The container value is published through Lit context only while the host is
 * connected. Before the first connection and after disconnection, the provider
 * value is `undefined`.
 *
 * @group Provision
 *
 * @param host - The host element.
 * @param options - Provisioning options.
 * @param options.container - External container instance to provide.
 * @param options.config - Managed container creation config.
 * @returns An instance of {@link ContainerProvider}.
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   private containerProvider: ContainerProvider = useContainerProvision(this, {
 *     config: {
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
 *   private containerProvider: ContainerProvider = useContainerProvision(this, { container: container });
 * }
 * ```
 */
export function useContainerProvision<E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  options: UseContainerProvisionOptions
): ContainerProvider<E> {
  return new ContainerProvider(host, options);
}
