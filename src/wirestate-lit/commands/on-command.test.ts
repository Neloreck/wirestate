import { ReactiveElement } from "@lit/reactive-element";
import { CommandBus, CommandDescriptor, CommandStatus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

import { onCommand } from "./on-command";

describe("@onCommand", () => {
  @customElement("ws-on-command-test-component")
  class DecoratedCommandElement extends ReactiveElement {
    @onCommand("TEST_COMMAND")
    public handleTestCommand(data: string): string {
      return data + "-handled";
    }
  }

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should register decorated method as command handler on connect and unregister on disconnect", () => {
    const { provider, container } = fixture;

    const bus: CommandBus = container.get(CommandBus);
    const element: DecoratedCommandElement = new DecoratedCommandElement();

    expect(bus.has("TEST_COMMAND")).toBe(false);

    provider.appendChild(element);
    expect(bus.has("TEST_COMMAND")).toBe(true);

    element.remove();
    expect(bus.has("TEST_COMMAND")).toBe(false);
  });

  it("should call decorated method when command is dispatched", async () => {
    const { provider, container } = fixture;

    const bus: CommandBus = container.get(CommandBus);
    const element: DecoratedCommandElement = new DecoratedCommandElement();

    provider.appendChild(element);

    const descriptor: CommandDescriptor<string> = bus.command("TEST_COMMAND", "input");
    const result: string = await descriptor.task;

    expect(result).toBe("input-handled");
    expect(descriptor.status).toBe(CommandStatus.SETTLED);

    element.remove();

    expect(() => bus.command("TEST_COMMAND", "input")).toThrow(
      "No command handler registered in container for type: 'TEST_COMMAND'."
    );
  });
});
