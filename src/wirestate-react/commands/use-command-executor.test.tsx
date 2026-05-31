import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus, createContainer } from "@wirestate/core";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { CommandExecutor } from "../types/commands";
import { Optional } from "../types/general";

import { useCommandExecutor } from "./use-command-executor";

describe("useCommandExecutor", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return an executor that dispatches commands", () => {
    const container: Container = createContainer();
    const handler = jest.fn((data: string) => data + "-result");

    container.get(CommandBus).register("TEST_COMMAND", handler);

    let executor: Optional<CommandExecutor> = null;

    function TestComponent() {
      executor = useCommandExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const result: string = (executor as unknown as CommandExecutor)<string, string>("TEST_COMMAND", "some-data");

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
  });

  it("should throw on unhandled commands", () => {
    const container: Container = createContainer();
    let executor: CommandExecutor = null as unknown as CommandExecutor;

    function TestComponent() {
      executor = useCommandExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    expect(() => (executor as unknown as CommandExecutor)("NOT_EXISTING", 1000)).toThrow(
      "No command handler registered in container for type: 'NOT_EXISTING'."
    );
  });
});
