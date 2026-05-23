import { ContextConsumer } from "@lit/context";
import { ReactiveElement } from "@lit/reactive-element";
import { Container, createContainer, Injectable, OnActivated, OnDeactivation } from "@wirestate/core";
import { customElement } from "lit/decorators.js";

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
      options: {
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

    const lifecycleEvents: Array<string> = [];

    @Injectable()
    class LifecycleService {
      @OnActivated()
      public onActivated(): void {
        lifecycleEvents.push("activate");
      }
    }

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      options: {
        activate: [LifecycleService],
        entries: [LifecycleService],
      },
    });

    expect(lifecycleEvents).toEqual([]);

    fixture.provider.appendChild(element);

    expect(provider.value.get(LifecycleService)).toBeInstanceOf(LifecycleService);
    expect(lifecycleEvents).toEqual(["activate"]);
  });

  it("should activate all configured entries when activate is true", () => {
    fixture = createLitProvision();

    const lifecycleEvents: Array<string> = [];

    @Injectable()
    class FirstService {
      @OnActivated()
      public onActivated(): void {
        lifecycleEvents.push("first");
      }
    }

    @Injectable()
    class SecondService {
      @OnActivated()
      public onActivated(): void {
        lifecycleEvents.push("second");
      }
    }

    const element: TestProviderElement = new TestProviderElement();

    new SubContainerProvider(element, {
      options: {
        activate: true,
        entries: [FirstService, SecondService],
      },
    });

    expect(lifecycleEvents).toEqual([]);

    fixture.provider.appendChild(element);

    expect(lifecycleEvents).toEqual(["first", "second"]);
  });

  it("should destroy child container on disconnect and recreate it on reconnect", () => {
    fixture = createLitProvision();

    const lifecycleEvents: Array<string> = [];

    @Injectable()
    class LifecycleService {
      @OnActivated()
      public onActivated(): void {
        lifecycleEvents.push("activate");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        lifecycleEvents.push("deactivate");
      }
    }

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      options: {
        activate: [LifecycleService],
        entries: [LifecycleService, { id: CONFIG_TOKEN, value: "stable" }],
      },
    });

    fixture.provider.appendChild(element);

    const firstContainer: Container = provider.value;

    expect(firstContainer.get(CONFIG_TOKEN)).toBe("stable");
    expect(lifecycleEvents).toEqual(["activate"]);

    element.remove();

    expect(lifecycleEvents).toEqual(["activate", "deactivate"]);

    fixture.provider.appendChild(element);

    const secondContainer: Container = provider.value;

    expect(secondContainer).not.toBe(firstContainer);
    expect(secondContainer.get(CONFIG_TOKEN)).toBe("stable");
    expect(lifecycleEvents).toEqual(["activate", "deactivate", "activate"]);
  });

  it("should recreate child container when parent context changes", () => {
    const firstParent: Container = createContainer({
      entries: [{ id: PARENT_TOKEN, value: "first-parent" }],
    });
    const secondParent: Container = createContainer({
      entries: [{ id: PARENT_TOKEN, value: "second-parent" }],
    });

    fixture = createLitProvision(firstParent);

    const lifecycleEvents: Array<string> = [];

    @Injectable()
    class LifecycleService {
      @OnActivated()
      public onActivated(): void {
        lifecycleEvents.push("activate");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        lifecycleEvents.push("deactivate");
      }
    }

    const element: TestProviderElement = new TestProviderElement();
    const provider: SubContainerProvider = new SubContainerProvider(element, {
      options: {
        activate: [LifecycleService],
        entries: [LifecycleService, { id: CONFIG_TOKEN, value: "child-value" }],
      },
    });

    fixture.provider.appendChild(element);

    const firstContainer: Container = provider.value;

    expect(firstContainer.get(PARENT_TOKEN)).toBe("first-parent");
    expect(lifecycleEvents).toEqual(["activate"]);

    fixture.contextProvider.value = secondParent;

    const secondContainer: Container = provider.value;

    expect(secondContainer).not.toBe(firstContainer);
    expect(secondContainer.get(CONFIG_TOKEN)).toBe("child-value");
    expect(secondContainer.get(PARENT_TOKEN)).toBe("second-parent");
    expect(lifecycleEvents).toEqual(["activate", "deactivate", "activate"]);
  });

  it("should not throw when disconnected before a parent context is received", () => {
    fixture = createLitProvision();

    const element: TestProviderElement = new TestProviderElement();

    new SubContainerProvider(element, {
      options: {
        entries: [{ id: CONFIG_TOKEN, value: "child-value" }],
      },
    });

    document.body.appendChild(element);

    expect(() => element.remove()).not.toThrow();
  });
});
