import { ReactiveControllerHost } from "@lit/reactive-element";
import { Container } from "@wirestate/core";

import { AnyObject } from "../types/general";

import { IocProviderController } from "./ioc-provider-controller";

export interface UseIocProvisionOptions {
  container?: Container;
  seed?: AnyObject;
}

export function useIocProvision<E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  options: UseIocProvisionOptions = {}
): IocProviderController {
  return new IocProviderController(host, options);
}
