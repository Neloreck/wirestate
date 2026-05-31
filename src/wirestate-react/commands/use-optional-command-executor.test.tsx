import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus, createContainer } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { OptionalCommandExecutor } from "../types/commands";

import { useOptionalCommandExecutor } from "./use-optional-command-executor";

describe("useOptionalCommandExecutor", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return null if no handler exists", () => {
    const container: Container = createContainer();

    let executor: OptionalCommandExecutor = null as unknown as OptionalCommandExecutor;

    function TestComponent() {
      executor = useOptionalCommandExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect(executor as unknown).toBeInstanceOf(Function);
    expect((executor as unknown as OptionalCommandExecutor)("MISSING_CMD")).toBeNull();
  });

  it("should return a command result if handler exists", () => {
    const container: Container = createContainer();

    container.get(CommandBus).register("EXISTING_COMMAND", () => "ok");

    let executor: OptionalCommandExecutor = null as unknown as OptionalCommandExecutor;

    function TestComponent() {
      executor = useOptionalCommandExecutor();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: string | null = (executor as OptionalCommandExecutor)<string>("EXISTING_COMMAND");

    expect(result).toBe("ok");
  });
});
