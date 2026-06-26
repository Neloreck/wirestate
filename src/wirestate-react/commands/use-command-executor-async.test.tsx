/**
 * @jest-environment jsdom
 */

import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { type CommandExecutorAsync } from "../types/commands";

import { useCommandExecutorAsync } from "./use-command-executor-async";

describe("useCommandExecutorAsync", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return an executor that dispatches sync commands as promises", async () => {
    const container: Container = new Container({ bindings: [CommandBus] });
    const bus: CommandBus = container.get(CommandBus);
    const handler = jest.fn((payload: string) => payload + "-result");

    bus.register("TEST_COMMAND", handler);
    jest.spyOn(bus, "executeAsync");

    let executor: CommandExecutorAsync = null as unknown as CommandExecutorAsync;

    function TestComponent() {
      executor = useCommandExecutorAsync();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    await expect(executor<string, string>("TEST_COMMAND", "some-payload")).resolves.toBe("some-payload-result");
    expect(handler).toHaveBeenCalledWith("some-payload");
    expect(bus.executeAsync).toHaveBeenCalledWith("TEST_COMMAND", "some-payload");
  });

  it("should dispatch async command handlers", async () => {
    const container: Container = new Container({ bindings: [CommandBus] });

    container.get(CommandBus).register("ASYNC_COMMAND", async (payload: string) => payload + "-result");

    let executor: CommandExecutorAsync = null as unknown as CommandExecutorAsync;

    function TestComponent() {
      executor = useCommandExecutorAsync();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    await expect(executor<string, string>("ASYNC_COMMAND", "some-payload")).resolves.toBe("some-payload-result");
  });

  it("should reject on unhandled commands", async () => {
    const container: Container = new Container({ bindings: [CommandBus] });
    let executor: CommandExecutorAsync = null as unknown as CommandExecutorAsync;

    function TestComponent() {
      executor = useCommandExecutorAsync();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    await expect(executor("NOT_EXISTING", 1000)).rejects.toThrow(
      "No command handler registered in container for type: 'NOT_EXISTING'."
    );
  });
});
