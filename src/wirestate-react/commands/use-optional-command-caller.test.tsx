import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { OptionalCommandCaller } from "../types/commands";

import { useOptionalCommandCaller } from "./use-optional-command-caller";

describe("useOptionalCommandCaller", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return null if no handler exists", () => {
    const container: Container = mockContainer();

    let caller: OptionalCommandCaller = null as unknown as OptionalCommandCaller;

    function TestComponent() {
      caller = useOptionalCommandCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    expect(caller as unknown).toBeInstanceOf(Function);
    expect((caller as unknown as OptionalCommandCaller)("MISSING_CMD")).toBeNull();
  });

  it("should return descriptor if handler exists", async () => {
    const container: Container = mockContainer();

    container.get(CommandBus).register("EXISTING_COMMAND", () => "ok");

    let caller: OptionalCommandCaller = null as unknown as OptionalCommandCaller;

    function TestComponent() {
      caller = useOptionalCommandCaller();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const descriptor = (caller as unknown as OptionalCommandCaller)("EXISTING_COMMAND");

    expect(descriptor).not.toBeNull();
    expect(await descriptor!.task).toBe("ok");
  });
});
