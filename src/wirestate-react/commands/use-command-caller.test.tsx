import { render, cleanup } from "@testing-library/react";
import { Container } from "inversify";

import {
  COMMAND_BUS,
  CommandBus,
  CommandStatus,
  CommandDescriptor,
  CommandCaller,
  createIocContainer,
} from "@/wirestate";
import { useCommandCaller } from "@/wirestate-react/commands/use-command-caller";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";
import { Optional } from "@/wirestate-react/types/general";

describe("useCommandCaller", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return a caller that dispatches commands", async () => {
    const container: Container = createIocContainer();
    const handler = jest.fn((data: string) => data + "-result");

    container.get<CommandBus>(COMMAND_BUS).register("TEST_COMMAND", handler);

    let caller: Optional<CommandCaller> = null;

    function TestComponent() {
      caller = useCommandCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const descriptor: CommandDescriptor = (caller as unknown as CommandCaller)("TEST_COMMAND", "some-data");

    expect(descriptor.status).toBe(CommandStatus.PENDING);

    const result: unknown = await descriptor.task;

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
  });

  it("should throw on unhandled commands", async () => {
    const container: Container = createIocContainer();
    let caller: CommandCaller = null as unknown as CommandCaller;

    function TestComponent() {
      caller = useCommandCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect(() => (caller as unknown as CommandCaller)("NOT_EXISTING", 1000)).toThrow(
      "No command handler registered in container for type: 'NOT_EXISTING'."
    );
  });
});
