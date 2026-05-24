import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus, CommandStatus, CommandDescriptor } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { CommandExecutor } from "../types/commands";
import { Optional } from "../types/general";

import { useCommandExecutor } from "./use-command-executor";

describe("useCommandExecutor", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return an executor that dispatches commands", async () => {
    const container: Container = mockContainer();
    const handler = jest.fn((data: string) => data + "-result");

    container.get(CommandBus).register("TEST_COMMAND", handler);

    let executor: Optional<CommandExecutor> = null;

    function TestComponent() {
      executor = useCommandExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const descriptor: CommandDescriptor = (executor as unknown as CommandExecutor)("TEST_COMMAND", "some-data");

    expect(descriptor.status).toBe(CommandStatus.PENDING);

    const result: unknown = await descriptor.task;

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
  });

  it("should throw on unhandled commands", async () => {
    const container: Container = mockContainer();
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
