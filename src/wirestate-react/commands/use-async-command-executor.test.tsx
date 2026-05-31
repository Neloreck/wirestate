import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus, createContainer } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { AsyncCommandExecutor } from "../types/commands";

import { useAsyncCommandExecutor } from "./use-async-command-executor";

describe("useAsyncCommandExecutor", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return an executor that dispatches sync commands as promises", async () => {
    const container: Container = createContainer();
    const bus: CommandBus = container.get(CommandBus);
    const handler = jest.fn((data: string) => data + "-result");

    bus.register("TEST_COMMAND", handler);
    jest.spyOn(bus, "executeAsync");

    let executor: AsyncCommandExecutor = null as unknown as AsyncCommandExecutor;

    function TestComponent() {
      executor = useAsyncCommandExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    await expect(executor<string, string>("TEST_COMMAND", "some-data")).resolves.toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
    expect(bus.executeAsync).toHaveBeenCalledWith("TEST_COMMAND", "some-data");
  });

  it("should dispatch async command handlers", async () => {
    const container: Container = createContainer();

    container.get(CommandBus).register("ASYNC_COMMAND", async (data: string) => data + "-result");

    let executor: AsyncCommandExecutor = null as unknown as AsyncCommandExecutor;

    function TestComponent() {
      executor = useAsyncCommandExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    await expect(executor<string, string>("ASYNC_COMMAND", "some-data")).resolves.toBe("some-data-result");
  });

  it("should reject on unhandled commands", async () => {
    const container: Container = createContainer();
    let executor: AsyncCommandExecutor = null as unknown as AsyncCommandExecutor;

    function TestComponent() {
      executor = useAsyncCommandExecutor();

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
