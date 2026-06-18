import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { type CommandExecutor } from "../types/commands";
import { type Nullable } from "../types/general";

import { useCommandExecutor } from "./use-command-executor";

describe("useCommandExecutor", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return an executor that dispatches commands", () => {
    const container: Container = new Container({ bindings: [CommandBus] });
    const handler = jest.fn((payload: string) => payload + "-result");

    container.get(CommandBus).register("TEST_COMMAND", handler);

    let executor: Nullable<CommandExecutor> = null;

    function TestComponent() {
      executor = useCommandExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: string = (executor as unknown as CommandExecutor)<string, string>("TEST_COMMAND", "some-payload");

    expect(result).toBe("some-payload-result");
    expect(handler).toHaveBeenCalledWith("some-payload");
  });

  it("should throw on unhandled commands", () => {
    const container: Container = new Container({ bindings: [CommandBus] });
    let executor: CommandExecutor = null as unknown as CommandExecutor;

    function TestComponent() {
      executor = useCommandExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect(() => (executor as unknown as CommandExecutor)("NOT_EXISTING", 1000)).toThrow(
      "No command handler registered in container for type: 'NOT_EXISTING'."
    );
  });
});
