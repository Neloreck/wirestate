import { ContextProvider } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer } from "@wirestate/core";

import { ContainerContext } from "../context/container-context";

let isProviderDefined: boolean = false;

export class WsTestProviderElement extends ReactiveElement {}

/**
 * Describes fixture returned by {@link createLitProvision}.
 *
 * @group Test-utils
 */
export interface LitProvisionFixture {
  /**
   * Provider element appended to `document.body`.
   */
  readonly provider: HTMLElement;

  /**
   * Lit context provider.
   */
  readonly contextProvider: ContextProvider<typeof ContainerContext, WsTestProviderElement>;

  /**
   * The IoC container provided to child elements.
   */
  readonly container: Container;

  /**
   * Removes the provider element from the DOM. Call in `afterEach`.
   */
  cleanup(): void;
}

/**
 * Creates a test provider element with an IoC container and appends it to the DOM.
 *
 * @remarks
 * Child elements appended to the returned provider can consume the context via `ContextConsumer`.
 *
 * @group Test-utils
 *
 * @param container - Optional pre-configured container.
 * @returns An instance of {@link LitProvisionFixture}.
 */
export function createLitProvision(container: Container = createContainer()): LitProvisionFixture {
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
