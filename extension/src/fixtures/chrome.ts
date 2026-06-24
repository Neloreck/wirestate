/**
 * A jest-mocked `chrome.runtime.Port` plus drivers for tests: `emit` fires the registered
 * `onMessage` listeners and `disconnect` fires the `onDisconnect` listeners. Shared by the
 * backend / bridge / background transport tests.
 */
export interface MockChromePort {
  readonly name: string;
  readonly sender?: { readonly tab?: { readonly id?: number } };
  readonly postMessage: jest.Mock;
  readonly onMessage: { readonly addListener: jest.Mock };
  readonly onDisconnect: { readonly addListener: jest.Mock };
  /**
   * Invokes every registered `onMessage` listener (simulates an inbound port message).
   */
  emit(message: unknown): void;
  /**
   * Invokes every registered `onDisconnect` listener (simulates the port dropping).
   */
  disconnect(): void;
}

/**
 * Builds a {@link MockChromePort} for transport tests.
 *
 * @param options - Optional port `name` and sender `tabId` (the background router pairs on `sender.tab.id`).
 * @param options.name - Name of the connection.
 * @param options.tabId - Identifier of the connection tab.
 * @returns A mock port with capturing jest spies plus `emit` / `disconnect` drivers.
 */
export function mockChromePort(options: { readonly name?: string; readonly tabId?: number } = {}): MockChromePort {
  const onMessage = { addListener: jest.fn() };
  const onDisconnect = { addListener: jest.fn() };

  return {
    name: options.name ?? "",
    sender: options.tabId === undefined ? undefined : { tab: { id: options.tabId } },
    postMessage: jest.fn(),
    onMessage,
    onDisconnect,
    emit: (message) => onMessage.addListener.mock.calls.forEach(([listener]) => listener(message)),
    disconnect: () => onDisconnect.addListener.mock.calls.forEach(([listener]) => listener()),
  };
}

/**
 * Casts a {@link MockChromePort} to the structural `chrome.runtime.Port` type for passing into the
 * code under test, which only touches the mocked surface.
 *
 * @param port - The mock port to cast.
 * @returns The same object typed as a real `chrome.runtime.Port`.
 */
export function asChromePort(port: MockChromePort): chrome.runtime.Port {
  return port as unknown as chrome.runtime.Port;
}

/**
 * Wraps arbitrary data as the `window` `MessageEvent` that `window.postMessage` delivers across the
 * MAIN / ISOLATED bridge boundary.
 *
 * @param data - The value exposed as the event's `data` property.
 * @returns A `MessageEvent` whose `data` is the given value.
 */
export function mockPageMessageEvent(data: unknown): MessageEvent {
  return { data } as unknown as MessageEvent;
}
