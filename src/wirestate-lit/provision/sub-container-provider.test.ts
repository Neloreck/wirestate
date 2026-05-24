import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer } from "@wirestate/core";
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

  it("should provision child containers and deprovision before disposal", () => {
    fixture = createLitProvision();

    const { LifecycleService, events } = createLifecycleService();
    const element: TestProviderElement = new TestProviderElement();

    new SubContainerProvider(element, {
      config: {
        entries: [LifecycleService],
      },
    });

    expect(events).toEqual([]);

    fixture.provider.appendChild(element);

    expect(events).toEqual(["activated", "provision"]);

    element.remove();

    expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
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
