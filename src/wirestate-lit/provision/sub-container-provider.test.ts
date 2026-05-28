import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer, Injectable } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { ContainerContext } from "../context/container-context";
import { OnEventController } from "../events/on-event-controller";
import { createLitProvision, LitProvisionFixture } from "../test-utils/create-lit-provision";
import { Maybe } from "../types/general";

import { SubContainerProvider } from "./sub-container-provider";

describe("SubContainerProvider", () => {
  const CONFIG_TOKEN: string = "CONFIG_TOKEN";
  const PARENT_TOKEN: string = "PARENT_TOKEN";

  @customElement("ws-sub-container-provider-host")
  class TestProviderElement extends ReactiveElement {}

  @customElement("ws-sub-container-provider-child")
  class TestChildElement extends ReactiveElement {}

  let fixture: LitProvisionFixture;

  afterEach(() => {
    fixture?.cleanup();
  });

  it("should create sub-container with current context as parent and provide it to descendants", () => {
    const parent: Container = createContainer({
      bindings: [{ id: PARENT_TOKEN, value: "parent-value" }],
    });

    fixture = createLitProvision(parent);

    const element: TestProviderElement = new TestProviderElement();
    const child: TestChildElement = new TestChildElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: {
        bindings: [{ id: CONFIG_TOKEN, value: "child-value" }],
      },
    });

    expect(provider.value).toBeUndefined();

    fixture.provider.appendChild(element);

    let receivedContext: Maybe<Container>;

    new ContextConsumer(child, {
      context: ContainerContext,
      subscribe: true,
      callback: (context) => {
        receivedContext = context;
      },
    });

    element.appendChild(child);

    expect(provider.value).toBeInstanceOf(Container);
    expect(provider.value).not.toBe(parent);
    expect(provider.value.get(CONFIG_TOKEN)).toBe("child-value");
    expect(provider.value.get(PARENT_TOKEN)).toBe("parent-value");
    expect(parent.isBound(CONFIG_TOKEN)).toBe(false);
    expect(receivedContext).toBe(provider.value);

    element.remove();

    expect(provider.value).toBeUndefined();
  });

  it("should activate configured bindings when the sub-container is created", () => {
    fixture = createLitProvision();

    const { LifecycleService, events } = createLifecycleService({ methods: ["activated"] });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: {
        activate: [LifecycleService],
        bindings: [LifecycleService],
      },
    });

    expect(events).toEqual([]);

    fixture.provider.appendChild(element);

    expect(provider.value.get(LifecycleService)).toBeInstanceOf(LifecycleService);
    expect(events).toEqual(["activated"]);
  });

  it("should validate activation bindings before a parent context is received", () => {
    @Injectable()
    class LifecycleService {}

    const element: TestProviderElement = new TestProviderElement();

    expect(
      () =>
        new SubContainerProvider(element, { config: { activate: ["MissingService"], bindings: [LifecycleService] } })
    ).toThrow("is listed in 'activate' but was not provided in 'bindings'.");
  });

  it("should provision sub-containers and deprovision before disposal", () => {
    fixture = createLitProvision();

    const { LifecycleService, events } = createLifecycleService();
    const element: TestProviderElement = new TestProviderElement();

    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: {
        bindings: [LifecycleService],
      },
    });

    expect(events).toEqual([]);

    fixture.provider.appendChild(element);

    expect(events).toEqual(["activated", "provision"]);

    element.remove();

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
    expect(provider.value).toBeUndefined();
  });

  it("should not publish undefined to subscribed event controllers on disconnect", () => {
    fixture = createLitProvision();

    const element: TestProviderElement = new TestProviderElement();
    const child: TestChildElement = new TestChildElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: { bindings: [] },
    });

    new OnEventController(child, null, jest.fn());

    fixture.provider.appendChild(element);

    const receivedContexts: Array<Container> = [];

    new ContextConsumer(child, {
      context: ContainerContext,
      subscribe: true,
      callback: (context) => {
        receivedContexts.push(context);
      },
    });

    element.appendChild(child);

    expect(provider.value).toBeInstanceOf(Container);
    expect(receivedContexts).toEqual([provider.value]);

    const providedContainer: Container = provider.value;

    expect(() => element.remove()).not.toThrow();
    expect(provider.value).toBeUndefined();
    expect(receivedContexts).toEqual([providedContainer]);
  });

  it("should reject direct sub-container replacement values", () => {
    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: { bindings: [{ id: CONFIG_TOKEN, value: "child-value" }] },
    });

    expect(() => provider.setValue(createContainer({ bindings: [{ id: CONFIG_TOKEN, value: "next-value" }] }))).toThrow(
      "SubContainerProvider owns its sub-container. Use `setConfig(config)` to replace the managed sub-container."
    );
  });

  it("should deprovision previous sub-containers and provision updated config", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, { config: { bindings: [FirstService] } });

    fixture = createLitProvision();

    fixture.provider.appendChild(element);

    expect(events).toEqual(["activated-first", "provision-first"]);

    provider.setConfig({ bindings: [SecondService] });

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "deprovision-first",
      "deactivation-first",
      "activated-second",
      "provision-second",
    ]);

    element.remove();

    expect(events).toEqual([
      "activated-first",
      "provision-first",
      "deprovision-first",
      "deactivation-first",
      "activated-second",
      "provision-second",
      "deprovision-second",
      "deactivation-second",
    ]);
    expect(provider.value).toBeUndefined();
  });

  it("should validate replacement config before replacing the active sub-container", () => {
    fixture = createLitProvision();

    const { LifecycleService, events } = createLifecycleService({
      methods: ["activated", "deactivation"],
    });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: { bindings: [LifecycleService] },
    });

    fixture.provider.appendChild(element);

    const firstContainer: Container = provider.value;

    expect(events).toEqual(["activated"]);

    expect(() =>
      provider.setConfig({
        activate: ["MissingService"],
        bindings: [LifecycleService],
      })
    ).toThrow("is listed in 'activate' but was not provided in 'bindings'.");

    expect(provider.value).toBe(firstContainer);
    expect(events).toEqual(["activated"]);
  });

  it("should only store replacement config when setConfig is called before first mount", () => {
    const events: Array<string> = [];
    const { LifecycleService: ManagedService } = createLifecycleService({ events, suffix: "managed" });
    const { LifecycleService: ReplacementService } = createLifecycleService({ events, suffix: "replacement" });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: { bindings: [ManagedService] },
    });

    fixture = createLitProvision();

    provider.setConfig({ bindings: [ReplacementService] });

    expect(events).toEqual([]);
    expect(provider.value).toBeUndefined();

    fixture.provider.appendChild(element);

    expect(provider.value.get(ReplacementService)).toBeInstanceOf(ReplacementService);
    expect(events).toEqual(["activated-replacement", "provision-replacement"]);

    element.remove();
    expect(events).toEqual([
      "activated-replacement",
      "provision-replacement",
      "deprovision-replacement",
      "deactivation-replacement",
    ]);
    expect(provider.value).toBeUndefined();
  });

  it("should only store replacement config while unmounted and ignore parent changes while disconnected", () => {
    const firstParent: Container = createContainer({ bindings: [{ id: PARENT_TOKEN, value: "first-parent" }] });
    const secondParent: Container = createContainer({ bindings: [{ id: PARENT_TOKEN, value: "second-parent" }] });

    fixture = createLitProvision(firstParent);

    const events: Array<string> = [];
    const { LifecycleService: ManagedService } = createLifecycleService({ events, suffix: "managed" });
    const { LifecycleService: ReplacementService } = createLifecycleService({ events, suffix: "replacement" });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: { bindings: [ManagedService] },
    });

    fixture.provider.appendChild(element);

    expect(provider.value.get(PARENT_TOKEN)).toBe("first-parent");
    expect(events).toEqual(["activated-managed", "provision-managed"]);

    element.remove();

    expect(events).toEqual(["activated-managed", "provision-managed", "deprovision-managed", "deactivation-managed"]);

    provider.setConfig({ bindings: [ReplacementService] });
    fixture.contextProvider.value = secondParent;

    expect(provider.value).toBeUndefined();
    expect(events).toEqual(["activated-managed", "provision-managed", "deprovision-managed", "deactivation-managed"]);

    fixture.provider.appendChild(element);

    expect(events).toEqual([
      "activated-managed",
      "provision-managed",
      "deprovision-managed",
      "deactivation-managed",
      "activated-replacement",
      "provision-replacement",
    ]);
  });

  it("should activate all configured bindings when activate is true", () => {
    fixture = createLitProvision();

    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({
      events,
      methods: ["activated"],
      suffix: "first",
    });
    const { LifecycleService: SecondService } = createLifecycleService({
      events,
      methods: ["activated"],
      suffix: "second",
    });

    const element: TestProviderElement = new TestProviderElement();

    new SubContainerProvider(element, {
      config: {
        activate: true,
        bindings: [FirstService, SecondService],
      },
    });

    expect(events).toEqual([]);

    fixture.provider.appendChild(element);

    expect(events).toEqual(["activated-first", "activated-second"]);
  });

  it("should activate all configured bindings by default", () => {
    fixture = createLitProvision();

    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const element: TestProviderElement = new TestProviderElement();

    new SubContainerProvider(element, {
      config: {
        bindings: [FirstService, SecondService],
      },
    });

    expect(events).toEqual([]);

    fixture.provider.appendChild(element);

    expect(events).toEqual(["activated-first", "activated-second", "provision-first", "provision-second"]);
  });

  it("should not activate configured bindings when activate is false", () => {
    fixture = createLitProvision();

    const events: Array<string> = [];

    @Injectable()
    class PlainService {
      public constructor() {
        events.push("activate");
      }
    }

    const element: TestProviderElement = new TestProviderElement();

    new SubContainerProvider(element, { config: { activate: false, bindings: [PlainService] } });

    fixture.provider.appendChild(element);

    expect(events).toEqual([]);
  });

  it("should destroy sub-container on disconnect and recreate it on reconnect", () => {
    fixture = createLitProvision();

    const { LifecycleService, events } = createLifecycleService({ methods: ["activated", "deactivation"] });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: {
        activate: [LifecycleService],
        bindings: [LifecycleService, { id: CONFIG_TOKEN, value: "stable" }],
      },
    });

    fixture.provider.appendChild(element);

    const firstContainer: Container = provider.value;

    expect(firstContainer.get(CONFIG_TOKEN)).toBe("stable");
    expect(events).toEqual(["activated"]);

    element.remove();

    expect(events).toEqual(["activated", "deactivation"]);
    expect(provider.value).toBeUndefined();

    fixture.provider.appendChild(element);

    const secondContainer: Container = provider.value;

    expect(secondContainer).not.toBe(firstContainer);
    expect(secondContainer.get(CONFIG_TOKEN)).toBe("stable");
    expect(events).toEqual(["activated", "deactivation", "activated"]);
  });

  it("should recreate sub-container when parent context changes", () => {
    const firstParent: Container = createContainer({
      bindings: [{ id: PARENT_TOKEN, value: "first-parent" }],
    });
    const secondParent: Container = createContainer({
      bindings: [{ id: PARENT_TOKEN, value: "second-parent" }],
    });

    fixture = createLitProvision(firstParent);

    const { LifecycleService, events } = createLifecycleService({ methods: ["activated", "deactivation"] });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: {
        activate: [LifecycleService],
        bindings: [LifecycleService, { id: CONFIG_TOKEN, value: "child-value" }],
      },
    });

    fixture.provider.appendChild(element);

    const firstContainer: Container = provider.value;

    expect(firstContainer.get(PARENT_TOKEN)).toBe("first-parent");
    expect(events).toEqual(["activated"]);

    fixture.contextProvider.value = secondParent;

    const secondContainer: Container = provider.value;

    expect(secondContainer).not.toBe(firstContainer);
    expect(secondContainer.get(CONFIG_TOKEN)).toBe("child-value");
    expect(secondContainer.get(PARENT_TOKEN)).toBe("second-parent");
    expect(events).toEqual(["activated", "deactivation", "activated"]);
  });

  it("should not throw when disconnected before a parent context is received", () => {
    fixture = createLitProvision();

    const element: TestProviderElement = new TestProviderElement();

    new SubContainerProvider(element, {
      config: {
        bindings: [{ id: CONFIG_TOKEN, value: "child-value" }],
      },
    });

    document.body.appendChild(element);

    expect(() => element.remove()).not.toThrow();
  });
});
