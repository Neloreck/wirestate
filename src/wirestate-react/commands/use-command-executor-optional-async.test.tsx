/**
 * @jest-environment jsdom
 */

import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { type CommandExecutorOptionalAsync } from "../types/commands";
import { type Optional } from "../types/general";

import { useCommandExecutorOptionalAsync } from "./use-command-executor-optional-async";

describe("useCommandExecutorOptionalAsync", () => {
  afterEach(() => {
    cleanup();
  });

  it("should resolve undefined if no handler exists", async () => {
    const container: Container = new Container({ bindings: [CommandBus] });

    let executor: CommandExecutorOptionalAsync = null as unknown as CommandExecutorOptionalAsync;

    function TestComponent() {
      executor = useCommandExecutorOptionalAsync();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect(executor as unknown).toBeInstanceOf(Function);
    await expect(executor("MISSING_CMD")).resolves.toBeUndefined();
  });

  it("should return a command result if handler exists", async () => {
    const container: Container = new Container({ bindings: [CommandBus] });
    const bus: CommandBus = container.get(CommandBus);

    bus.register("EXISTING_COMMAND", () => "ok");
    jest.spyOn(bus, "executeOptionalAsync");

    let executor: CommandExecutorOptionalAsync = null as unknown as CommandExecutorOptionalAsync;

    function TestComponent() {
      executor = useCommandExecutorOptionalAsync();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = await executor<string>("EXISTING_COMMAND");

    expect(result).toBe("ok");
    expect(bus.executeOptionalAsync).toHaveBeenCalledWith("EXISTING_COMMAND", undefined);
  });

  it("should support async command handlers", async () => {
    const container: Container = new Container({ bindings: [CommandBus] });

    container.get(CommandBus).register("ASYNC_COMMAND", async () => "async-ok");

    let executor: CommandExecutorOptionalAsync = null as unknown as CommandExecutorOptionalAsync;

    function TestComponent() {
      executor = useCommandExecutorOptionalAsync();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    await expect(executor<string>("ASYNC_COMMAND")).resolves.toBe("async-ok");
  });
});
