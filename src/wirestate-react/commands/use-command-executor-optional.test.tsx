/**
 * @jest-environment jsdom
 */

import { render, cleanup } from "@testing-library/react";
import { Container, CommandBus } from "@wirestate/core";

import { ContainerProvider } from "../provision/container-provider";
import { type CommandExecutorOptional } from "../types/commands";
import { type Optional } from "../types/general";

import { useCommandExecutorOptional } from "./use-command-executor-optional";

describe("useCommandExecutorOptional", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return undefined if no handler exists", () => {
    const container: Container = new Container({ bindings: [CommandBus] });

    let executor: CommandExecutorOptional = null as unknown as CommandExecutorOptional;

    function TestComponent() {
      executor = useCommandExecutorOptional();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    expect(executor as unknown).toBeInstanceOf(Function);
    expect((executor as unknown as CommandExecutorOptional)("MISSING_CMD")).toBeUndefined();
  });

  it("should return a command result if handler exists", () => {
    const container: Container = new Container({ bindings: [CommandBus] });

    container.get(CommandBus).register("EXISTING_COMMAND", () => "ok");

    let executor: CommandExecutorOptional = null as unknown as CommandExecutorOptional;

    function TestComponent() {
      executor = useCommandExecutorOptional();

      return null;
    }

    render(
      <ContainerProvider container={container}>
        <TestComponent />
      </ContainerProvider>
    );

    const result: Optional<string> = (executor as CommandExecutorOptional)<string>("EXISTING_COMMAND");

    expect(result).toBe("ok");
  });
});
