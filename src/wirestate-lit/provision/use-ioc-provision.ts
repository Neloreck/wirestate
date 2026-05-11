import { ReactiveControllerHost } from "@lit/reactive-element";
import { Container } from "@wirestate/core";

import { AnyObject } from "../types/general";

import { IocProviderController } from "./ioc-provider-controller";

/**
 * Represents options for the {@link useIocProvision} hook.
 *
 * @group Provision
 */
export interface UseIocProvisionOptions {
  /**
   * Optional existing container to use.
   */
  container?: Container;
  /**
   * Optional seed data to apply to the container.
   */
  seed?: AnyObject;
}

/**
 * Hook (controller) to provide an IoC container to the host element and its children.
 *
 * @group Provision
 *
 * @param host - The host element.
 * @param options - Provisioning options.
 * @param options.container - Optional existing container to use.
 * @param options.seed - Optional seed data to apply to the container.
 * @returns Ioc provision controller instance.
 *
 * @example
 * ```typescript
 * class MyRootElement extends LitElement {
 *   private ioc = useIocProvision(this, { seed: { initialData: '...' } });
 * }
 * ```
 */
export function useIocProvision<E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  options: UseIocProvisionOptions = {}
): IocProviderController<E> {
  return new IocProviderController(host, options);
}
