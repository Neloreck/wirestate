import { ReactiveControllerHost } from "@lit/reactive-element";

import { InjectablesProviderController, InjectablesProviderControllerOptions } from "./injectables-provider-controller";

/**
 * Hook that binds injectables to the nearest IoC container for the host element's lifetime.
 *
 * @group Provision
 *
 * @param host - The host element.
 * @param options - Provisioning options.
 * @returns An instance of {@link InjectablesProviderController}.
 *
 * @example
 * ```typescript
 * class MyComponent extends LitElement {
 *   private services = useInjectablesProvider(this, {
 *     entries: [AuthService, UserService],
 *     activate: [AuthService],
 *   });
 * }
 * ```
 */
export function useInjectablesProvider<E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  options: InjectablesProviderControllerOptions
): InjectablesProviderController<E> {
  return new InjectablesProviderController<E>(host, options);
}
