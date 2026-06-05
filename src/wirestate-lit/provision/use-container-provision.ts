import { ReactiveControllerHost } from "@lit/reactive-element";

import { ContainerProvider, ContainerProviderOptions } from "./container-provider";

/**
 * Describes options for {@link useContainerProvider}.
 *
 * @group Provision
 */
export type UseContainerProviderOptions = ContainerProviderOptions;

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
 * @param options.scope - Managed container messaging scope.
 * @returns An instance of {@link ContainerProvider}.
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   private containerProvider: ContainerProvider = useContainerProvider(this, {
 *     config: {
 *       activate: [LoggerService],
 *       bindings: [LoggerService],
 *     },
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   private containerProvider: ContainerProvider = useContainerProvider(this, { container: container });
 * }
 * ```
 */
export function useContainerProvider<E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  options: UseContainerProviderOptions
): ContainerProvider<E> {
  return new ContainerProvider(host, options);
}
