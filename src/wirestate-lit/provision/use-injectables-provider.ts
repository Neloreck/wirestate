import { ReactiveControllerHost } from "@lit/reactive-element";

import { InjectablesProviderController, InjectablesProviderControllerOptions } from "./injectables-provider-controller";

/**
 * Binds a set of injectables to the nearest IoC container for the host element's lifetime.
 *
 * Entries are bound when the host connects and unbound when it disconnects.
 *
 * @group Provision
 *
 * @param host - The host element.
 * @param options - Provisioning options.
 * @param options.entries - List of service entries to bind to the container.
 * @param options.into - Target IoC context; if omitted, uses the nearest provider context.
 * @param options.activate - List of service identifiers to activate immediately after binding.
 * @param options.seeds - Seed data applied before binding.
 * @returns The controller instance.
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
