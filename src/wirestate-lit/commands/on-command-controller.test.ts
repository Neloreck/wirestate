import { ReactiveElement } from "@lit/reactive-element";
import { CommandBus, Container, createContainer } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "@/fixtures/lit-utils/create-lit-provision";

import { OnCommandController } from "./on-command-controller";

describe("OnCommandController", () => {
  @customElement("ws-cmd-consumer")
  class TestConsumerElement extends ReactiveElement {}

  let fixture: LitProvisionFixture;

  beforeEach(() => {
    fixture = createLitProvision();
  });

  afterEach(() => {
    fixture.cleanup();
  });

  it("should register handler when host connects / unregister on disconnect", () => {
    const { provider, container } = fixture;

    const bus: CommandBus = container.get(CommandBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    new OnCommandController(element, "TEST_COMMAND", handler);
    expect(bus.hasHandler("TEST_COMMAND")).toBe(false);

    provider.appendChild(element);
    expect(bus.hasHandler("TEST_COMMAND")).toBe(true);

    element.remove();
    expect(bus.hasHandler("TEST_COMMAND")).toBe(false);
  });

  it("should invoke handler with correct data when command is dispatched", () => {
    const { provider, container } = fixture;

    const bus: CommandBus = container.get(CommandBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn((data: string) => data + "-result");

    new OnCommandController(element, "SOME_COMMAND", handler);

    provider.appendChild(element);

    const result: string = bus.execute("SOME_COMMAND", "payload");

    expect(handler).toHaveBeenCalledWith("payload");
    expect(result).toBe("payload-result");

    element.remove();
    expect(() => bus.execute("SOME_COMMAND", "payload")).toThrow(
      "No command handler registered in container for type: 'SOME_COMMAND'."
    );
  });

  it("should support async handlers", async () => {
    const { provider, container } = fixture;

    const bus: CommandBus = container.get(CommandBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn(async (data: number) => data * 2);

    new OnCommandController(element, "ASYNC_COMMAND", handler);

    provider.appendChild(element);

    await expect(bus.executeAsync<number, number>("ASYNC_COMMAND", 21)).resolves.toBe(42);
  });

  it("should re-register when container context is updated", () => {
    const firstContainer: Container = createContainer();
    const secondContainer: Container = createContainer();
    const bus: CommandBus = firstContainer.get(CommandBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    const { provider, contextProvider } = createLitProvision(firstContainer);

    new OnCommandController(element, "REVISION_COMMAND", handler);

    provider.appendChild(element);
    expect(bus.hasHandler("REVISION_COMMAND")).toBe(true);

    contextProvider.setValue(secondContainer);
    expect(firstContainer.get(CommandBus).hasHandler("REVISION_COMMAND")).toBe(false);
    expect(secondContainer.get(CommandBus).hasHandler("REVISION_COMMAND")).toBe(true);
  });
});
