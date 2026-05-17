import { ReactiveControllerHost } from "@lit/reactive-element";

import {
  SubContainerProviderController,
  SubContainerProviderControllerOptions,
} from "./sub-container-provider-controller";

/**
 * Hook that provides a managed child container for the host element's lifetime.
 *
 * @remarks
 * The child container is derived from the current parent
 * {@link ContainerContext}, recreated when that parent context changes, and
 * destroyed when the host disconnects.
 *
 * @group Provision
 *
 * @param host - The host element.
 * @param options - Provisioning options.
 * @param options.options - Child-container creation options.
 * @returns An instance of {@link SubContainerProviderController}.
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   private container: SubContainerProviderController = useSubContainerProvider(this, {
 *     options: {
 *       entries: [AuthService, UserService],
 *     },
 *   });
 * }
 * ```
 */
export function useSubContainerProvider<E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  options: SubContainerProviderControllerOptions
): SubContainerProviderController<E> {
  return new SubContainerProviderController<E>(host, options);
}
