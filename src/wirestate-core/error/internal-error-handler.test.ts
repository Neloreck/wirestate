import { Container } from "../container/container";

import {
  type InternalErrorDescriptor,
  defaultInternalErrorHandler,
  reportWirestateInternalError,
} from "./internal-error-handler";

describe("internal error handler", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => void 0);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("defaultInternalErrorHandler prints the message, source, and error", () => {
    const error: Error = new Error("boom");

    defaultInternalErrorHandler({ error, message: "Something failed", source: "event-handler" });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain("Something failed");
    expect(consoleErrorSpy.mock.calls[0]).toContain(error);
  });

  it("falls back to the default handler when no container handler is configured", () => {
    reportWirestateInternalError({ error: new Error("boom"), message: "No handler", source: "event-handler" });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it("routes to a configured container error handler instead of the default", () => {
    const onError = jest.fn();

    const container: Container = new Container({ onError });
    const descriptor: InternalErrorDescriptor = {
      container,
      error: new Error("boom"),
      message: "Routed",
      source: "event-handler",
    };

    reportWirestateInternalError(descriptor);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(descriptor);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("falls back to the default handler and reports the failure when a custom handler throws", () => {
    const handlerError: Error = new Error("handler boom");

    const onError = jest.fn(() => {
      throw handlerError;
    });

    const container: Container = new Container({ onError });

    reportWirestateInternalError({
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
