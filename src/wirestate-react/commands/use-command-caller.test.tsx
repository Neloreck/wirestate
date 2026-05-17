import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus, CommandStatus, CommandDescriptor } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { CommandCaller } from "../types/commands";
import { Optional } from "../types/general";

import { useCommandCaller } from "./use-command-caller";

describe("useCommandCaller", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return a caller that dispatches commands", async () => {
    const container: Container = mockContainer();
    const handler = jest.fn((data: string) => data + "-result");

    container.get(CommandBus).register("TEST_COMMAND", handler);

    let caller: Optional<CommandCaller> = null;

    function TestComponent() {
      caller = useCommandCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const descriptor: CommandDescriptor = (caller as unknown as CommandCaller)("TEST_COMMAND", "some-data");

    expect(descriptor.status).toBe(CommandStatus.PENDING);

    const result: unknown = await descriptor.task;

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
  });

  it("should throw on unhandled commands", async () => {
    const container: Container = mockContainer();
    let caller: CommandCaller = null as unknown as CommandCaller;

    function TestComponent() {
      caller = useCommandCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    expect(() => (caller as unknown as CommandCaller)("NOT_EXISTING", 1000)).toThrow(
      "No command handler registered in container for type: 'NOT_EXISTING'."
    );
  });
});
