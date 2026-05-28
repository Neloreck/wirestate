import { ReactiveControllerHost } from "@lit/reactive-element";

import { SubContainerProvider, SubContainerProviderOptions } from "./sub-container-provider";

/**
 * Hook that provides a managed sub-container for the host element's lifetime.
 *
 * @remarks
 * The sub-container is derived from the current parent
 * {@link ContainerContext}, recreated when that parent context changes, and
 * destroyed when the host disconnects. Provider lifecycle hooks run while the
 * sub-container is connected.
 *
 * The sub-container value is published through Lit context only while the
 * host is connected. Before the first connection and after disconnection, the
 * provider value is `undefined`.
 *
 * @group Provision
 *
 * @param host - The host element.
 * @param options - Provisioning options.
 * @param options.config - Sub-container creation options.
 * @returns An instance of {@link SubContainerProvider}.
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   private containerProvider: SubContainerProvider = useSubContainerProvider(this, {
 *     config: {
 *       bindings: [AuthService, UserService],
 *     },
 *   });
 * }
 * ```
 */
export function useSubContainerProvider<E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  options: SubContainerProviderOptions
): SubContainerProvider<E> {
  return new SubContainerProvider<E>(host, options);
}
