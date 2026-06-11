import { ContextProvider } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container } from "@wirestate/core";

import { ContainerContext } from "../../wirestate-lit/context/container-context";

let isProviderDefined: boolean = false;

export class WsTestProviderElement extends ReactiveElement {}

export interface LitProvisionFixture {
  readonly provider: HTMLElement;
  readonly contextProvider: ContextProvider<typeof ContainerContext, WsTestProviderElement>;
  readonly container: Container;

  cleanup(): void;
}

export function createLitProvision(container: Container = new Container()): LitProvisionFixture {
  if (!isProviderDefined) {
    customElements.define("ws-test-provider", WsTestProviderElement);
    isProviderDefined = true;
  }

  const provider: WsTestProviderElement = new WsTestProviderElement();

  const contextProvider: ContextProvider<typeof ContainerContext, WsTestProviderElement> = new ContextProvider(
    provider,
    {
      context: ContainerContext,
      initialValue: container,
    }
  );

  document.body.appendChild(provider);

  return {
    provider,
    contextProvider,
    container,
    cleanup: () => provider.remove(),
  };
}
