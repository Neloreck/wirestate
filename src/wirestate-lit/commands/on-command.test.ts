import { ReactiveElement } from "@lit/reactive-element";
import { CommandBus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "@/fixtures/lit-utils/create-lit-provision";

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

    expect(bus.hasHandler("TEST_COMMAND")).toBe(false);

    provider.appendChild(element);
    expect(bus.hasHandler("TEST_COMMAND")).toBe(true);

    element.remove();
    expect(bus.hasHandler("TEST_COMMAND")).toBe(false);
  });

  it("should call decorated method when command is dispatched", () => {
    const { provider, container } = fixture;

    const bus: CommandBus = container.get(CommandBus);
    const element: DecoratedCommandElement = new DecoratedCommandElement();

    provider.appendChild(element);

    const result: string = bus.execute("TEST_COMMAND", "input");

    expect(result).toBe("input-handled");

    element.remove();

    expect(() => bus.execute("TEST_COMMAND", "input")).toThrow(
      "No command handler registered in container for type: 'TEST_COMMAND'."
    );
  });
});
