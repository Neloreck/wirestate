/**
 * @jest-environment jsdom
 */

import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { type OptionalCommandExecutor } from "../types/commands";
import { type Optional } from "../types/general";

import { useOptionalCommandExecutor } from "./use-optional-command-executor";

describe("useOptionalCommandExecutor", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return undefined if no handler exists", () => {
    const container: Container = new Container({ bindings: [CommandBus] });

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
    expect((executor as unknown as OptionalCommandExecutor)("MISSING_CMD")).toBeUndefined();
  });

  it("should return a command result if handler exists", () => {
    const container: Container = new Container({ bindings: [CommandBus] });

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

    const result: Optional<string> = (executor as OptionalCommandExecutor)<string>("EXISTING_COMMAND");

    expect(result).toBe("ok");
  });
});
