import { ContextProvider } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, createIocContainer } from "@wirestate/core";

import { IocContextObject } from "../context/ioc-context";

let isProviderDefined: boolean = false;

export class WsTestProviderElement extends ReactiveElement {}

function ensureProviderDefined(): void {
  if (!isProviderDefined) {
    customElements.define("ws-test-provider", WsTestProviderElement);
    isProviderDefined = true;
  }
}

/**
 * Represents the result of the {@link createLitProvision} utility.
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
  readonly contextProvider: ContextProvider<typeof IocContextObject, WsTestProviderElement>;
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
export function createLitProvision(container?: Container): LitProvisionFixture {
  ensureProviderDefined();

  const iocContainer: Container = container ?? createIocContainer();
  const provider: WsTestProviderElement = new WsTestProviderElement();

  const contextProvider: ContextProvider<typeof IocContextObject, WsTestProviderElement> = new ContextProvider(
    provider,
    {
      context: IocContextObject,
      initialValue: {
        container: iocContainer,
        revision: 1,
        nextRevision: () => 1,
      },
    }
  );

  document.body.appendChild(provider);

  return {
    provider,
    contextProvider,
    container: iocContainer,
    cleanup: () => provider.remove(),
  };
}
