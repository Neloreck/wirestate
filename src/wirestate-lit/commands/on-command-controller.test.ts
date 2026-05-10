import { ReactiveElement } from "@lit/reactive-element";
import { CommandBus, CommandDescriptor, CommandStatus, createIocContainer } from "@wirestate/core";
import { Container } from "inversify";
import { customElement } from "lit/decorators.js";

import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";

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
    expect(bus.has("TEST_COMMAND")).toBe(false);

    provider.appendChild(element);
    expect(bus.has("TEST_COMMAND")).toBe(true);

    element.remove();
    expect(bus.has("TEST_COMMAND")).toBe(false);
  });

  it("should invoke handler with correct data when command is dispatched", async () => {
    const { provider, container } = fixture;

    const bus: CommandBus = container.get(CommandBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn((data: string) => data + "-result");

    new OnCommandController(element, "SOME_COMMAND", handler);

    provider.appendChild(element);

    const descriptor: CommandDescriptor<string> = bus.command("SOME_COMMAND", "payload");
    const result: string = await descriptor.task;

    expect(handler).toHaveBeenCalledWith("payload");
    expect(descriptor.status).toBe(CommandStatus.SETTLED);
    expect(result).toBe("payload-result");

    element.remove();
    expect(() => bus.command("SOME_COMMAND", "payload")).toThrow(
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

    const descriptor: CommandDescriptor<number> = bus.command("ASYNC_COMMAND", 21);

    expect(await descriptor.task).toBe(42);
  });

  it("should re-register when IoC context is updated (revision, container)", () => {
    const container: Container = createIocContainer();
    const bus: CommandBus = container.get(CommandBus);
    const element: TestConsumerElement = new TestConsumerElement();
    const handler = jest.fn();

    const { provider, contextProvider } = createLitProvision(container);

    new OnCommandController(element, "REVISION_COMMAND", handler);

    provider.appendChild(element);
    expect(bus.has("REVISION_COMMAND")).toBe(true);

    contextProvider.setValue({ ...contextProvider.value, revision: 1000 });
    expect(bus.has("REVISION_COMMAND")).toBe(true);

    const newContainer: Container = createIocContainer();

    contextProvider.setValue({ ...contextProvider.value, container: newContainer });
    expect(container.get(CommandBus).has("REVISION_COMMAND")).toBe(false);
    expect(newContainer.get(CommandBus).has("REVISION_COMMAND")).toBe(true);
  });
});
