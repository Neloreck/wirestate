import { ReactiveControllerHost } from "@lit/reactive-element";

import { SubContainerProvider, SubContainerProviderOptions } from "./sub-container-provider";

/**
 * Hook that provides a managed child container for the host element's lifetime.
 *
 * @remarks
 * The child container is derived from the current parent
 * {@link ContainerContext}, recreated when that parent context changes, and
 * destroyed when the host disconnects. Provider lifecycle hooks run while the
 * child container is connected.
 *
 * @group Provision
 *
 * @param host - The host element.
 * @param options - Provisioning options.
 * @param options.config - Child-container creation options.
 * @returns An instance of {@link SubContainerProvider}.
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   private containerProvider: SubContainerProvider = useSubContainerProvider(this, {
 *     config: {
 *       entries: [AuthService, UserService],
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
