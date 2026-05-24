import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus } from "@wirestate/core";
import { mockContainer } from "@wirestate/core/test-utils";

import { withContainerProvider } from "../test-utils/with-container-provider";
import { OptionalCommandExecutor } from "../types/commands";

import { useOptionalCommandExecutor } from "./use-optional-command-executor";

describe("useOptionalCommandExecutor", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return null if no handler exists", () => {
    const container: Container = mockContainer();

    let executor: OptionalCommandExecutor = null as unknown as OptionalCommandExecutor;

    function TestComponent() {
      executor = useOptionalCommandExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    expect(executor as unknown).toBeInstanceOf(Function);
    expect((executor as unknown as OptionalCommandExecutor)("MISSING_CMD")).toBeNull();
  });

  it("should return descriptor if handler exists", async () => {
    const container: Container = mockContainer();

    container.get(CommandBus).register("EXISTING_COMMAND", () => "ok");

    let executor: OptionalCommandExecutor = null as unknown as OptionalCommandExecutor;

    function TestComponent() {
      executor = useOptionalCommandExecutor();

      return null;
    }

    render(withContainerProvider(<TestComponent />, container));

    const descriptor = (executor as unknown as OptionalCommandExecutor)("EXISTING_COMMAND");

    expect(descriptor).not.toBeNull();
    expect(await descriptor!.task).toBe("ok");
  });
});
