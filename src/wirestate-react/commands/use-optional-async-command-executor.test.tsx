import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { OptionalAsyncCommandExecutor } from "../types/commands";
import { Optional } from "../types/general";

import { useOptionalAsyncCommandExecutor } from "./use-optional-async-command-executor";

describe("useOptionalAsyncCommandExecutor", () => {
  afterEach(() => {
    cleanup();
  });

  it("should resolve null if no handler exists", async () => {
    const container: Container = mockContainer();

    let executor: OptionalAsyncCommandExecutor = null as unknown as OptionalAsyncCommandExecutor;

    function TestComponent() {
      executor = useOptionalAsyncCommandExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    expect(executor as unknown).toBeInstanceOf(Function);
    await expect(executor("MISSING_CMD")).resolves.toBeNull();
  });

  it("should return a command result if handler exists", async () => {
    const container: Container = mockContainer();
    const bus: CommandBus = container.get(CommandBus);

    bus.register("EXISTING_COMMAND", () => "ok");
    jest.spyOn(bus, "executeOptionalAsync");

    let executor: OptionalAsyncCommandExecutor = null as unknown as OptionalAsyncCommandExecutor;

    function TestComponent() {
      executor = useOptionalAsyncCommandExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const result: Optional<string> = await executor<string>("EXISTING_COMMAND");

    expect(result).toBe("ok");
    expect(bus.executeOptionalAsync).toHaveBeenCalledWith("EXISTING_COMMAND", undefined);
  });

  it("should support async command handlers", async () => {
    const container: Container = mockContainer();

    container.get(CommandBus).register("ASYNC_COMMAND", async () => "async-ok");

    let executor: OptionalAsyncCommandExecutor = null as unknown as OptionalAsyncCommandExecutor;

    function TestComponent() {
      executor = useOptionalAsyncCommandExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    await expect(executor<string>("ASYNC_COMMAND")).resolves.toBe("async-ok");
  });
});
