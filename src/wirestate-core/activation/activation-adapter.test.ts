import { ContainerKernel } from "../container/container-kernel";
import { Injectable } from "../metadata/metadata-injectable";

import { type ActivationAdapter, getActivationAdapter, setActivationAdapter } from "./activation-adapter";

function mockAdapter(overrides: Partial<ActivationAdapter> = {}): ActivationAdapter {
  return {
    activate: jest.fn(),
    deactivate: jest.fn(),
    rollback: jest.fn(),
    ...overrides,
  };
}

describe("container activation adapter registry", () => {
  it("should return undefined when no adapter is installed", () => {
    expect(getActivationAdapter(new ContainerKernel())).toBeUndefined();
  });

  it("should return the installed adapter", () => {
    const container = new ContainerKernel();
    const adapter: ActivationAdapter = mockAdapter();

    setActivationAdapter(container, adapter);

    expect(getActivationAdapter(container)).toBe(adapter);
  });

  it("should replace a previously installed adapter", () => {
    const container = new ContainerKernel();
    const first: ActivationAdapter = mockAdapter();
    const second: ActivationAdapter = mockAdapter();

    setActivationAdapter(container, first);
    setActivationAdapter(container, second);

    expect(getActivationAdapter(container)).toBe(second);
  });

  it("should walk the parent chain to the nearest installed adapter", () => {
    const grandparent = new ContainerKernel();
    const parent = new ContainerKernel(grandparent);
    const child = new ContainerKernel(parent);
    const adapter: ActivationAdapter = mockAdapter();

    setActivationAdapter(grandparent, adapter);

    expect(getActivationAdapter(child)).toBe(adapter);
    expect(getActivationAdapter(parent)).toBe(adapter);
  });

  it("should prefer the own adapter over ancestor adapters", () => {
    const parent = new ContainerKernel();
    const child = new ContainerKernel(parent);
    const parentAdapter: ActivationAdapter = mockAdapter();
    const childAdapter: ActivationAdapter = mockAdapter();

    setActivationAdapter(parent, parentAdapter);
    setActivationAdapter(child, childAdapter);

    expect(getActivationAdapter(child)).toBe(childAdapter);
  });

  it("should not leak adapters between unrelated containers", () => {
    const first = new ContainerKernel();
    const second = new ContainerKernel();

    setActivationAdapter(first, mockAdapter());

    expect(getActivationAdapter(second)).toBeUndefined();
  });
});

describe("container activation adapter seam", () => {
  it("should activate once per instance binding, not for value or factory bindings", () => {
    @Injectable()
    class TestService {}

    const container = new ContainerKernel();
    const activated: Array<{ container: ContainerKernel; instance: unknown }> = [];

    setActivationAdapter(
      container,
      mockAdapter({
        activate: (target, record) => activated.push({ container: target, instance: record.instance }),
      })
    );

    container.bind({ token: TestService, type: "Instance", value: TestService });
    container.bind({ token: "config", value: { key: "value" } });
    container.bind({ token: "made", factory: () => ({ made: true }) });

    const instance: TestService = container.get(TestService);

    container.get(TestService);
    container.get("config");
    container.get("made");

    expect(activated).toEqual([{ container, instance }]);
  });

  it("should deactivate a constructed instance on unbind", () => {
    @Injectable()
    class TestService {}

    const container = new ContainerKernel();
    const deactivated: Array<unknown> = [];

    setActivationAdapter(
      container,
      mockAdapter({
        deactivate: (_target, record) => deactivated.push(record.instance),
      })
    );

    container.bind({ token: TestService, type: "Instance", value: TestService });

    const instance: TestService = container.get(TestService);

    expect(deactivated).toEqual([]);

    container.unbind(TestService);

    expect(deactivated).toEqual([instance]);
  });

  it("should roll back (not deactivate) and rethrow when activate throws", () => {
    @Injectable()
    class TestService {}

    const container = new ContainerKernel();
    const rollback = jest.fn();
    const deactivate = jest.fn();

    setActivationAdapter(
      container,
      mockAdapter({
        activate: () => {
          throw new Error("activate-fail");
        },
        rollback,
        deactivate,
      })
    );

    container.bind({ token: TestService, type: "Instance", value: TestService });

    expect(() => container.get(TestService)).toThrow("activate-fail");
    expect(rollback).toHaveBeenCalledTimes(1);
    expect(deactivate).not.toHaveBeenCalled();
    expect(container.getActiveInstances()).toEqual([]);
  });

  it("should construct and drop instances without an installed adapter", () => {
    @Injectable()
    class TestService {}

    const container = new ContainerKernel();

    container.bind({ token: TestService, type: "Instance", value: TestService });

    const instance: TestService = container.get(TestService);

    expect(instance).toBeInstanceOf(TestService);
    expect(container.getActiveInstances()).toEqual([instance]);

    expect(() => container.unbind(TestService)).not.toThrow();
    expect(container.getActiveInstances()).toEqual([]);
  });

  it("should run the parent's adapter for activations in bare child containers", () => {
    @Injectable()
    class TestService {}

    const parent = new ContainerKernel();
    const child = new ContainerKernel(parent);
    const activatedIn: Array<ContainerKernel> = [];

    setActivationAdapter(
      parent,
      mockAdapter({
        activate: (target) => activatedIn.push(target),
      })
    );

    child.bind({ token: TestService, type: "Instance", value: TestService });
    child.get(TestService);

    expect(activatedIn).toEqual([child]);
  });
});
