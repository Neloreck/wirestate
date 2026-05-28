import { ReactiveElement } from "@lit/reactive-element";
import { CommandBus, Command } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { OnCommandController } from "./on-command-controller";
import { useOnCommand } from "./use-on-command";

describe("useOnCommand hook", () => {
  @customElement("ws-cmd-consumer")
  class TestConsumerElement extends ReactiveElement {}

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should register and unregister handler via hook", () => {
    const { provider, container } = fixture;

    const bus: CommandBus = container.get(CommandBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn((data: string) => "hook-" + data);
    const controller = useOnCommand(element, { type: "HOOK_COMMAND", handler });

    expect(controller).toBeInstanceOf(OnCommandController);
    expect(bus.has("HOOK_COMMAND")).toBe(false);

    provider.appendChild(element);
    expect(bus.has("HOOK_COMMAND")).toBe(true);

    element.remove();
    expect(bus.has("HOOK_COMMAND")).toBe(false);
  });

  it("should call handler with correct data via hook", async () => {
    const { provider, container } = fixture;

    const bus: CommandBus = container.get(CommandBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn((data: number) => data + 100);

    useOnCommand(element, { type: "HOOK_COMMAND", handler });

    provider.appendChild(element);

    const command: Command<number> = bus.command<number, number>("HOOK_COMMAND", 5);
    const result: number = await command.task;

    expect(result).toBe(105);
    expect(handler).toHaveBeenCalledWith(5);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
