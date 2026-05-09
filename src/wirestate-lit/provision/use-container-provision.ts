import { ReactiveControllerHost } from "@lit/reactive-element";
import { Container } from "@wirestate/core";

import { ContainerProviderController } from "./container-provider-controller";

export interface UseContainerProvisionOptions {
  container?: Container;
}

export function useContainerProvision<E extends ReactiveControllerHost & HTMLElement>(
  host: E,
  { container }: UseContainerProvisionOptions
): UseContainerProvisionOptions {
  return new ContainerProviderController(host, container);
}
