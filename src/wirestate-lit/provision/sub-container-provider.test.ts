import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer, Injectable } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { ContainerContext } from "../context/container-context";
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

  it("should create child container with current context as parent and provide it to descendants", () => {
    const parent: Container = createContainer({
      entries: [{ id: PARENT_TOKEN, value: "parent-value" }],
    });

    fixture = createLitProvision(parent);

    const element: TestProviderElement = new TestProviderElement();
    const child: TestChildElement = new TestChildElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: {
        entries: [{ id: CONFIG_TOKEN, value: "child-value" }],
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

  it("should activate configured entries when the child container is created", () => {
    fixture = createLitProvision();

    const { LifecycleService, events } = createLifecycleService({ methods: ["activated"] });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: {
        activate: [LifecycleService],
        entries: [LifecycleService],
      },
    });

    expect(events).toEqual([]);

    fixture.provider.appendChild(element);

    expect(provider.value.get(LifecycleService)).toBeInstanceOf(LifecycleService);
    expect(events).toEqual(["activated"]);
  });

  it("should validate activation entries before a parent context is received", () => {
    @Injectable()
    class LifecycleService {}

    const element: TestProviderElement = new TestProviderElement();

    expect(
      () => new SubContainerProvider(element, { config: { activate: ["MissingService"], entries: [LifecycleService] } })
    ).toThrow("is listed in 'activate' but was not provided in 'entries'.");
  });

  it("should provision child containers and deprovision before disposal", () => {
    fixture = createLitProvision();

    const { LifecycleService, events } = createLifecycleService();
    const element: TestProviderElement = new TestProviderElement();

    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: {
        entries: [LifecycleService],
      },
    });

    expect(events).toEqual([]);

    fixture.provider.appendChild(element);

    expect(events).toEqual(["activated", "provision"]);

    element.remove();

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
    expect(provider.value).toBeUndefined();
  });

  it("should reject direct child container replacement values", () => {
    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: { entries: [{ id: CONFIG_TOKEN, value: "child-value" }] },
    });

    expect(() => provider.setValue(createContainer({ entries: [{ id: CONFIG_TOKEN, value: "next-value" }] }))).toThrow(
      "SubContainerProvider owns its child container. Use `setConfig(config)` to replace the managed child container."
    );
  });

  it("should deprovision previous child containers and provision updated config", () => {
    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, { config: { entries: [FirstService] } });

    fixture = createLitProvision();

    fixture.provider.appendChild(element);

    expect(events).toEqual(["activated-first", "provision-first"]);

    provider.setConfig({ entries: [SecondService] });

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

  it("should validate replacement config before replacing the active child container", () => {
    fixture = createLitProvision();

    const { LifecycleService, events } = createLifecycleService({
      methods: ["activated", "deactivation"],
    });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: { entries: [LifecycleService] },
    });

    fixture.provider.appendChild(element);

    const firstContainer: Container = provider.value;

    expect(events).toEqual(["activated"]);

    expect(() =>
      provider.setConfig({
        activate: ["MissingService"],
        entries: [LifecycleService],
      })
    ).toThrow("is listed in 'activate' but was not provided in 'entries'.");

    expect(provider.value).toBe(firstContainer);
    expect(events).toEqual(["activated"]);
  });

  it("should only store replacement config when setConfig is called before first mount", () => {
    const events: Array<string> = [];
    const { LifecycleService: ManagedService } = createLifecycleService({ events, suffix: "managed" });
    const { LifecycleService: ReplacementService } = createLifecycleService({ events, suffix: "replacement" });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, { config: { entries: [ManagedService] } });

    fixture = createLitProvision();

    provider.setConfig({ entries: [ReplacementService] });

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
    const firstParent: Container = createContainer({ entries: [{ id: PARENT_TOKEN, value: "first-parent" }] });
    const secondParent: Container = createContainer({ entries: [{ id: PARENT_TOKEN, value: "second-parent" }] });

    fixture = createLitProvision(firstParent);

    const events: Array<string> = [];
    const { LifecycleService: ManagedService } = createLifecycleService({ events, suffix: "managed" });
    const { LifecycleService: ReplacementService } = createLifecycleService({ events, suffix: "replacement" });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, { config: { entries: [ManagedService] } });

    fixture.provider.appendChild(element);

    expect(provider.value.get(PARENT_TOKEN)).toBe("first-parent");
    expect(events).toEqual(["activated-managed", "provision-managed"]);

    element.remove();

    expect(events).toEqual(["activated-managed", "provision-managed", "deprovision-managed", "deactivation-managed"]);

    provider.setConfig({ entries: [ReplacementService] });
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

  it("should activate all configured entries when activate is true", () => {
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
        entries: [FirstService, SecondService],
      },
    });

    expect(events).toEqual([]);

    fixture.provider.appendChild(element);

    expect(events).toEqual(["activated-first", "activated-second"]);
  });

  it("should activate all configured entries by default", () => {
    fixture = createLitProvision();

    const events: Array<string> = [];
    const { LifecycleService: FirstService } = createLifecycleService({ events, suffix: "first" });
    const { LifecycleService: SecondService } = createLifecycleService({ events, suffix: "second" });

    const element: TestProviderElement = new TestProviderElement();

    new SubContainerProvider(element, {
      config: {
        entries: [FirstService, SecondService],
      },
    });

    expect(events).toEqual([]);

    fixture.provider.appendChild(element);

    expect(events).toEqual(["activated-first", "activated-second", "provision-first", "provision-second"]);
  });

  it("should not activate configured entries when activate is false", () => {
    fixture = createLitProvision();

    const events: Array<string> = [];

    @Injectable()
    class PlainService {
      public constructor() {
        events.push("activate");
      }
    }

    const element: TestProviderElement = new TestProviderElement();

    new SubContainerProvider(element, { config: { activate: false, entries: [PlainService] } });

    fixture.provider.appendChild(element);

    expect(events).toEqual([]);
  });

  it("should destroy child container on disconnect and recreate it on reconnect", () => {
    fixture = createLitProvision();

    const { LifecycleService, events } = createLifecycleService({ methods: ["activated", "deactivation"] });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: {
        activate: [LifecycleService],
        entries: [LifecycleService, { id: CONFIG_TOKEN, value: "stable" }],
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

  it("should recreate child container when parent context changes", () => {
    const firstParent: Container = createContainer({
      entries: [{ id: PARENT_TOKEN, value: "first-parent" }],
    });
    const secondParent: Container = createContainer({
      entries: [{ id: PARENT_TOKEN, value: "second-parent" }],
    });

    fixture = createLitProvision(firstParent);

    const { LifecycleService, events } = createLifecycleService({ methods: ["activated", "deactivation"] });

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      config: {
        activate: [LifecycleService],
        entries: [LifecycleService, { id: CONFIG_TOKEN, value: "child-value" }],
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
        entries: [{ id: CONFIG_TOKEN, value: "child-value" }],
      },
    });

    document.body.appendChild(element);

    expect(() => element.remove()).not.toThrow();
  });
});
