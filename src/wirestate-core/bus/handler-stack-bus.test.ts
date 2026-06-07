import { WirestateError } from "../error/wirestate-error";
import { Optional } from "../types/general";

import { HandlerStackBus } from "./handler-stack-bus";

describe("HandlerStackBus", () => {
  /**
   * Minimal concrete subclass that surfaces the protected dispatch and
   * registration primitives so the shared base contract can be tested directly,
   * independently of {@link CommandBus} and {@link QueryBus}.
   */
  class Bus extends HandlerStackBus<string | symbol | number> {
    protected createMissingHandlerError(type: string | symbol | number): WirestateError {
      return new WirestateError(`No handler for '${String(type)}'.`, "TEST_MISSING_HANDLER");
    }

    public run<R = unknown, P = unknown>(type: string | symbol | number, payload?: P): R {
      return this.dispatch<R, P>(type, payload);
    }

    public runAsync<R = unknown, P = unknown>(type: string | symbol | number, payload?: P): Promise<R> {
      return this.dispatchAsync<R, P>(type, payload);
    }

    public runOptional<R = unknown, P = unknown>(type: string | symbol | number, payload?: P): Optional<R> {
      return this.dispatchOptional<R, P>(type, payload);
    }

    public runOptionalAsync<R = unknown, P = unknown>(
      type: string | symbol | number,
      payload?: P
    ): Promise<Optional<R>> {
      return this.dispatchOptionalAsync<R, P>(type, payload);
    }

    public add<R = unknown, P = unknown>(type: string | symbol | number, handler: (payload: P) => R): () => void {
      return this.registerHandler<R, P>(type, handler);
    }

    public remove<R = unknown, P = unknown>(type: string | symbol | number, handler: (payload: P) => R): void {
      this.unregisterHandler<R, P>(type, handler);
    }
  }

  it("should dispatch to the newest handler and pass the payload", () => {
    const bus: Bus = new Bus();

    bus.add("TYPE", () => "first");
    bus.add("TYPE", (payload) => `second:${payload}`);

    expect(bus.run("TYPE", "value")).toBe("second:value");
  });

  it("should throw the subclass-provided error when no handler is registered", () => {
    const bus: Bus = new Bus();

    expect(() => bus.run("MISSING")).toThrow("No handler for 'MISSING'.");
  });

  it("should reject through dispatchAsync when no handler is registered", async () => {
    const bus: Bus = new Bus();

    await expect(bus.runAsync("MISSING")).rejects.toThrow("No handler for 'MISSING'.");
  });

  it("should wrap sync results and pass through async results via dispatchAsync", async () => {
    const bus: Bus = new Bus();

    bus.add("SYNC", () => 21);
    bus.add("ASYNC", async () => 42);

    await expect(bus.runAsync("SYNC")).resolves.toBe(21);
    await expect(bus.runAsync("ASYNC")).resolves.toBe(42);
  });

  it("should return null from optional dispatch when no handler is registered", async () => {
    const bus: Bus = new Bus();

    expect(bus.runOptional("MISSING")).toBeNull();
    await expect(bus.runOptionalAsync("MISSING")).resolves.toBeNull();
  });

  it("should remove exactly the registration returned by registerHandler", () => {
    const bus: Bus = new Bus();
    const handler = jest.fn(() => "value");

    const unregisterFirst: () => void = bus.add("TYPE", handler);

    bus.add("TYPE", handler);

    unregisterFirst();
    unregisterFirst();

    expect(bus.run("TYPE")).toBe("value");
    expect(bus.hasHandler("TYPE")).toBe(true);
  });

  it("should remove the newest matching handler by reference and drop the empty stack", () => {
    const bus: Bus = new Bus();
    const handler = jest.fn(() => "value");

    bus.add("TYPE", handler);
    bus.add("TYPE", handler);

    bus.remove("TYPE", handler);
    expect(bus.run("TYPE")).toBe("value");

    bus.remove("TYPE", handler);
    expect(bus.hasHandler("TYPE")).toBe(false);
    expect(() => bus.run("TYPE")).toThrow("No handler for 'TYPE'.");
  });

  it("should clear all handlers and support symbol and number tokens", () => {
    const bus: Bus = new Bus();
    const symbolType: unique symbol = Symbol("type");

    bus.add(symbolType, () => "symbol");
    bus.add(7, () => "number");

    expect(bus.run(symbolType)).toBe("symbol");
    expect(bus.run(7)).toBe("number");

    bus.clear();

    expect(bus.hasHandler(symbolType)).toBe(false);
    expect(bus.hasHandler(7)).toBe(false);
  });
});
