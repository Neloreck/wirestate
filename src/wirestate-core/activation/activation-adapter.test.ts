import { ContainerKernel } from "../container/container-kernel";
import { Injectable } from "../metadata/metadata-injectable";

import { ActivationAdapter, getActivationAdapter, setActivationAdapter } from "./activation-adapter";
import { OnActivated } from "./on-activated";

describe("container activation adapter registry", () => {
  it("should return null when no adapter is installed", () => {
    expect(getActivationAdapter(new ContainerKernel())).toBeNull();
  });

  it("should return the installed adapter", () => {
    const container = new ContainerKernel();
    const adapter: ActivationAdapter = jest.fn();

    setActivationAdapter(container, adapter);

    expect(getActivationAdapter(container)).toBe(adapter);
  });

  it("should replace a previously installed adapter", () => {
    const container = new ContainerKernel();
    const first: ActivationAdapter = jest.fn();
    const second: ActivationAdapter = jest.fn();

    setActivationAdapter(container, first);
    setActivationAdapter(container, second);

    expect(getActivationAdapter(container)).toBe(second);
  });

  it("should walk the parent chain to the nearest installed adapter", () => {
    const grandparent = new ContainerKernel();
    const parent = new ContainerKernel(grandparent);
    const child = new ContainerKernel(parent);
    const adapter: ActivationAdapter = jest.fn();

    setActivationAdapter(grandparent, adapter);

    expect(getActivationAdapter(child)).toBe(adapter);
    expect(getActivationAdapter(parent)).toBe(adapter);
  });

  it("should prefer the own adapter over ancestor adapters", () => {
    const parent = new ContainerKernel();
    const child = new ContainerKernel(parent);
    const parentAdapter: ActivationAdapter = jest.fn();
    const childAdapter: ActivationAdapter = jest.fn();

    setActivationAdapter(parent, parentAdapter);
    setActivationAdapter(child, childAdapter);

    expect(getActivationAdapter(child)).toBe(childAdapter);
  });

  it("should not leak adapters between unrelated containers", () => {
    const first = new ContainerKernel();
    const second = new ContainerKernel();

    setActivationAdapter(first, jest.fn());

    expect(getActivationAdapter(second)).toBeNull();
  });
});

describe("container activation adapter seam", () => {
  it("should run the adapter once per instance activation", () => {
    @Injectable()
    class TestService {}

    const container = new ContainerKernel();
    const calls: Array<{ container: ContainerKernel; instance: object }> = [];

    setActivationAdapter(container, (target, instance) => {
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

    setActivationAdapter(container, () => {
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

    setActivationAdapter(container, (_target, _instance, disposers) => {
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

    setActivationAdapter(container, (_target, _instance, disposers) => {
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

    setActivationAdapter(parent, (target) => {
      activatedIn.push(target);
    });

    child.bind({ token: TestService, type: "Instance", value: TestService });
    child.get(TestService);

    expect(activatedIn).toEqual([child]);
  });
});
