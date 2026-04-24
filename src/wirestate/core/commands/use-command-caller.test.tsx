import { render, cleanup } from "@testing-library/react";
import { Container } from "inversify";

import { CommandBus } from "@/wirestate/core/commands/command-bus";
import { useCommandCaller } from "@/wirestate/core/commands/use-command-caller";
import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { COMMAND_BUS_TOKEN } from "@/wirestate/core/registry";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";
import { ECommandStatus, ICommandDescriptor, TCommandCaller } from "@/wirestate/types/commands";
import { Optional } from "@/wirestate/types/general";

describe("useCommandCaller", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return a caller that dispatches commands", async () => {
    const container: Container = createIocContainer();
    const handler = jest.fn((data: string) => data + "-result");

    container.get<CommandBus>(COMMAND_BUS_TOKEN).register("TEST_COMMAND", handler);

    let caller: Optional<TCommandCaller> = null;

    function TestComponent() {
      caller = useCommandCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const descriptor: ICommandDescriptor = (caller as unknown as TCommandCaller)("TEST_COMMAND", "some-data");

    expect(descriptor.status).toBe(ECommandStatus.PENDING);

    const result: unknown = await descriptor.task;

    expect(result).toBe("some-data-result");
    expect(handler).toHaveBeenCalledWith("some-data");
  });

  it("should throw on unhandled commands", async () => {
    const container: Container = createIocContainer();
    let caller: Optional<TCommandCaller> = null;

    function TestComponent() {
      caller = useCommandCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect(() => (caller as unknown as TCommandCaller)("NOT_EXISTING", 1000)).toThrow(
      "No command handler registered in container for type: 'NOT_EXISTING'."
    );
  });
});
