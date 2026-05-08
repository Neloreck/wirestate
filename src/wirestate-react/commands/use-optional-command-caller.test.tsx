import { render, cleanup } from "@testing-library/react";
import { Container } from "inversify";

import { CommandBus } from "@/wirestate/core/commands/command-bus";
import { useOptionalCommandCaller } from "@/wirestate-react/commands/use-optional-command-caller";
import { createIocContainer } from "@/wirestate/core/container/create-ioc-container";
import { COMMAND_BUS_TOKEN } from "@/wirestate/core/registry";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";
import { ICommandDescriptor, TOptionalCommandCaller } from "@/wirestate/types/commands";
import { Optional } from "@/wirestate/types/general";

describe("useOptionalCommandCaller", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return null if no handler exists", () => {
    const container: Container = createIocContainer();

    let caller: Optional<TOptionalCommandCaller> = null;

    function TestComponent() {
      caller = useOptionalCommandCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    expect(caller as unknown).toBeInstanceOf(Function);
    expect((caller as unknown as TOptionalCommandCaller)("MISSING_CMD")).toBeNull();
  });

  it("should return descriptor if handler exists", async () => {
    const container: Container = createIocContainer();

    container.get<CommandBus>(COMMAND_BUS_TOKEN).register("EXISTING_COMMAND", () => "ok");

    let caller: Optional<TOptionalCommandCaller> = null;

    function TestComponent() {
      caller = useOptionalCommandCaller();

      return null;
    }

    render(withIocProvider(<TestComponent />, container));

    const descriptor: Optional<ICommandDescriptor> = (caller as unknown as TOptionalCommandCaller)("EXISTING_COMMAND");

    expect(descriptor).not.toBeNull();
    expect(await descriptor!.task).toBe("ok");
  });
});
