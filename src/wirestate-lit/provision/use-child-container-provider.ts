import { ReactiveControllerHost } from "@lit/reactive-element";

import { ChildContainerProvider, ChildContainerProviderOptions } from "./child-container-provider";

/**
 * Hook that provides a managed child container for the host element's lifetime.
 *
 * @remarks
 * The child container is derived from the current parent
 * {@link ContainerContext}, recreated when that parent context changes, and
 * destroyed when the host disconnects. Provider lifecycle hooks run while the
 * child container is connected.
 *
 * The child container value is published through Lit context only while the
 * host is connected. Before the first connection and after disconnection, the
 * provider value is `undefined`.
 *
 * @group Provision
 *
 * @param host - The host element.
 * @param options - Provisioning options.
 * @param options.config - Child container creation options.
 * @returns An instance of {@link ChildContainerProvider}.
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   private containerProvider: ChildContainerProvider = useChildContainerProvider(this, {
 *     config: {
 *       bindings: [AuthService, UserService],
 *     },
 *   });
 * }
 * ```
 */
export function useChildContainerProvider<E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  options: ChildContainerProviderOptions
): ChildContainerProvider<E> {
  return new ChildContainerProvider<E>(host, options);
}
