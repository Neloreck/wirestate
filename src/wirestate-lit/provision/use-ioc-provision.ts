import { ReactiveControllerHost } from "@lit/reactive-element";
import { Container } from "@wirestate/core";

import { AnyObject } from "../types/general";

import { IocProviderController } from "./ioc-provider-controller";

/**
 * @group provision
 */
export interface UseIocProvisionOptions {
  container?: Container;
  seed?: AnyObject;
}

/**
 * @group provision
 * @param host
 * @param options
 */
export function useIocProvision<E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  options: UseIocProvisionOptions = {}
): IocProviderController {
  return new IocProviderController(host, options);
}
