import { Container } from "../container/container";

import {
  type WirestateErrorContext,
  defaultWirestateErrorHandler,
  reportWirestateError,
} from "./wirestate-error-handler";

describe("internal error handler", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => void 0);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("defaultWirestateErrorHandler prints the message, source, and error", () => {
    const error: Error = new Error("boom");

    defaultWirestateErrorHandler({ error, message: "Something failed", source: "event-handler" });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain("Something failed");
    expect(consoleErrorSpy.mock.calls[0]).toContain(error);
  });

  it("falls back to the default handler when no container handler is configured", () => {
    reportWirestateError({ error: new Error("boom"), message: "No handler", source: "event-handler" });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it("routes to a configured container error handler instead of the default", () => {
    const onError = jest.fn();

    const container: Container = new Container({ onError });
    const context: WirestateErrorContext = {
      container,
      error: new Error("boom"),
      message: "Routed",
      source: "event-handler",
    };

    reportWirestateError(context);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(context);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("falls back to the default handler and reports the failure when a custom handler throws", () => {
    const handlerError: Error = new Error("handler boom");

    const onError = jest.fn(() => {
      throw handlerError;
    });

    const container: Container = new Container({ onError });

    reportWirestateError({
      container,
      error: new Error("original"),
      message: "Original failure",
      source: "event-handler",
    });

    expect(onError).toHaveBeenCalledTimes(1);

    // The default handler reports both the original failure and the handler's own failure.
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy.mock.calls[1]).toContain(handlerError);
  });
});
