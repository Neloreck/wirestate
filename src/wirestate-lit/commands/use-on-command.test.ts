import { ReactiveElement } from "@lit/reactive-element";
import { CommandBus } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { type LitProvisionFixture, createLitProvision } from "@/fixtures/lit-utils/create-lit-provision";

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
    const handler = jest.fn((payload: string) => "hook-" + payload);
    const controller = useOnCommand(element, { type: "HOOK_COMMAND", handler });

    expect(controller).toBeInstanceOf(OnCommandController);
    expect(bus.hasHandler("HOOK_COMMAND")).toBe(false);

    provider.appendChild(element);
    expect(bus.hasHandler("HOOK_COMMAND")).toBe(true);

    element.remove();
    expect(bus.hasHandler("HOOK_COMMAND")).toBe(false);
  });

  it("should call handler with correct payload via hook", () => {
    const { provider, container } = fixture;

    const bus: CommandBus = container.get(CommandBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn((payload: number) => payload + 100);

    useOnCommand(element, { type: "HOOK_COMMAND", handler });

    provider.appendChild(element);

    const result: number = bus.execute<number, number>("HOOK_COMMAND", 5);

    expect(result).toBe(105);
    expect(handler).toHaveBeenCalledWith(5);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
