import { OnActivated } from "../lifecycle/on-activated";
import { Injectable } from "../metadata/metadata-injectable";

import {
  ContainerActivationAdapter,
  getContainerActivationAdapter,
  setContainerActivationAdapter,
} from "./container-activation-adapter";
import { ContainerKernel } from "./container-kernel";

describe("container activation adapter registry", () => {
  it("should return null when no adapter is installed", () => {
    expect(getContainerActivationAdapter(new ContainerKernel())).toBeNull();
  });

  it("should return the installed adapter", () => {
    const container = new ContainerKernel();
    const adapter: ContainerActivationAdapter = jest.fn();

    setContainerActivationAdapter(container, adapter);

    expect(getContainerActivationAdapter(container)).toBe(adapter);
  });

  it("should replace a previously installed adapter", () => {
    const container = new ContainerKernel();
    const first: ContainerActivationAdapter = jest.fn();
    const second: ContainerActivationAdapter = jest.fn();

    setContainerActivationAdapter(container, first);
    setContainerActivationAdapter(container, second);

    expect(getContainerActivationAdapter(container)).toBe(second);
  });

  it("should walk the parent chain to the nearest installed adapter", () => {
    const grandparent = new ContainerKernel();
    const parent = new ContainerKernel(grandparent);
    const child = new ContainerKernel(parent);
    const adapter: ContainerActivationAdapter = jest.fn();

    setContainerActivationAdapter(grandparent, adapter);

    expect(getContainerActivationAdapter(child)).toBe(adapter);
    expect(getContainerActivationAdapter(parent)).toBe(adapter);
  });

  it("should prefer the own adapter over ancestor adapters", () => {
    const parent = new ContainerKernel();
    const child = new ContainerKernel(parent);
    const parentAdapter: ContainerActivationAdapter = jest.fn();
    const childAdapter: ContainerActivationAdapter = jest.fn();

    setContainerActivationAdapter(parent, parentAdapter);
    setContainerActivationAdapter(child, childAdapter);

    expect(getContainerActivationAdapter(child)).toBe(childAdapter);
  });

  it("should not leak adapters between unrelated containers", () => {
    const first = new ContainerKernel();
    const second = new ContainerKernel();

    setContainerActivationAdapter(first, jest.fn());

    expect(getContainerActivationAdapter(second)).toBeNull();
  });
});

describe("container activation adapter seam", () => {
  it("should run the adapter once per instance activation", () => {
    @Injectable()
    class TestService {}

    const container = new ContainerKernel();
    const calls: Array<{ container: ContainerKernel; instance: object }> = [];

    setContainerActivationAdapter(container, (target, instance) => {
      calls.push({ container: target, instance });
    });

    container.bind({ token: TestService, type: "Instance", value: TestService });
    container.bind({ token: "config", value: { key: "value" } });
    container.bind({ token: "made", factory: () => ({ made: true }) });

    const instance: TestService = container.get(TestService);

    container.get(TestService);
    container.get("config");
    container.get("made");

    expect(calls).toEqual([{ container, instance }]);
  });

  it("should run the adapter before the @OnActivated hook", () => {
    const events: Array<string> = [];

    @Injectable()
    class TestService {
      @OnActivated()
      public onActivated(): void {
        events.push("activated");
      }
    }

    const container = new ContainerKernel();

    setContainerActivationAdapter(container, () => {
      events.push("adapter");
    });

    container.bind({ token: TestService, type: "Instance", value: TestService });
    container.get(TestService);

    expect(events).toEqual(["adapter", "activated"]);
  });

  it("should run adapter disposers on deactivation", () => {
    @Injectable()
    class TestService {}

    const events: Array<string> = [];
    const container = new ContainerKernel();

    setContainerActivationAdapter(container, (_target, _instance, disposers) => {
      disposers.push(() => events.push("disposed"));
    });

    container.bind({ token: TestService, type: "Instance", value: TestService });
    container.get(TestService);

    expect(events).toEqual([]);

    container.unbind(TestService);

    expect(events).toEqual(["disposed"]);
  });

  it("should roll back the activation when the adapter throws", () => {
    @Injectable()
    class TestService {}

    const events: Array<string> = [];
    const container = new ContainerKernel();

    setContainerActivationAdapter(container, (_target, _instance, disposers) => {
      disposers.push(() => events.push("disposed"));

      throw new Error("adapter-fail");
    });

    container.bind({ token: TestService, type: "Instance", value: TestService });

    expect(() => container.get(TestService)).toThrow("adapter-fail");
    expect(events).toEqual(["disposed"]);
    expect(container.getActiveInstances()).toEqual([]);
  });

  it("should run the parent's adapter for activations in bare child containers", () => {
    @Injectable()
    class TestService {}

    const parent = new ContainerKernel();
    const child = new ContainerKernel(parent);
    const activatedIn: Array<ContainerKernel> = [];

    setContainerActivationAdapter(parent, (target) => {
      activatedIn.push(target);
    });

    child.bind({ token: TestService, type: "Instance", value: TestService });
    child.get(TestService);

    expect(activatedIn).toEqual([child]);
  });
});
