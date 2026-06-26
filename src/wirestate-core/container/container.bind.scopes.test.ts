import { type InstanceBindingDescriptor } from "@wirestate/core";

import { OnDeactivation } from "../activation/on-deactivation";
import { InjectionToken } from "../binding/binding-tokens";
import { ERROR_CODE_INVALID_BINDING_SCOPE } from "../error/error-code";
import { Injectable } from "../metadata/metadata-injectable";

import { ContainerKernel } from "./container-kernel";

describe("Binding scopes", () => {
  it("should default to singleton scope for instance bindings", () => {
    const container = new ContainerKernel();

    @Injectable()
    class MyService {}

    container.bind({ token: MyService, type: "Instance", value: MyService });

    expect(container.get(MyService)).toBe(container.get(MyService));
  });

  it("should construct transient instance bindings on every resolution", () => {
    const container = new ContainerKernel();
    const constructed = jest.fn();

    @Injectable()
    class MyService {
      public constructor() {
        constructed();
      }
    }

    container.bind({ token: MyService, scope: "Transient", factory: () => new MyService() });

    const first = container.get(MyService);
    const second = container.get(MyService);

    expect(first).not.toBe(second);
    expect(constructed).toHaveBeenCalledTimes(2);
  });

  it("should construct transient dynamic value bindings on every resolution", () => {
    const container = new ContainerKernel();
    const token = new InjectionToken<{ id: number }>("counter");

    let id = 0;

    container.bind({
      token: token,
      scope: "Transient",
      factory: () => ({ id: (id += 1) }),
    });

    expect(container.get(token).id).toBe(1);
    expect(container.get(token).id).toBe(2);
  });

  it("should keep singleton scope when requested explicitly", () => {
    const container = new ContainerKernel();
    const token = new InjectionToken<object>("singleton");

    container.bind({ token: token, scope: "Singleton", factory: () => ({}) });

    expect(container.get(token)).toBe(container.get(token));
  });

  it("should resolve transient parent bindings through child containers", () => {
    const parent = new ContainerKernel();
    const child = new ContainerKernel(parent);

    @Injectable()
    class MyService {}

    parent.bind({ token: MyService, scope: "Transient", factory: () => new MyService() });

    expect(child.get(MyService)).not.toBe(child.get(MyService));
  });

  it("should reject a value binding declared with a non-singleton scope", () => {
    const container = new ContainerKernel();
    const token = new InjectionToken<number>("value-transient");

    // A value is always a singleton; a Transient (or any non-Singleton) scope is nonsensical for it.
    expect(() => container.bind({ token: token, value: 1, scope: "Transient" })).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE })
    );
    expect(() => container.bind({ token: token, value: 1, scope: "Transient" })).toThrow(
      "Provided unexpected binding scope for value."
    );
  });

  it("should reject an explicit Value-type binding declared with a non-singleton scope", () => {
    const container = new ContainerKernel();
    const token = new InjectionToken<number>("value-typed-transient");

    expect(() =>
      container.bind({
        token: token,
        type: "Value",
        value: 1,
        scope: "Transient",
      } as unknown as InstanceBindingDescriptor)
    ).toThrow("Provided unexpected binding scope for value.");
  });

  it("should allow a value binding declared with an explicit Singleton scope", () => {
    const container = new ContainerKernel();
    const token = new InjectionToken<number>("value-singleton");

    expect(() => container.bind({ token: token, value: 7, scope: "Singleton" })).not.toThrow();
    expect(container.get(token)).toBe(7);
  });

  it("should not block rebinding for transient bindings", () => {
    const container = new ContainerKernel();
    const token = new InjectionToken<string>("value");

    container.bind({ token: token, scope: "Transient", factory: () => "first" });

    expect(container.get(token)).toBe("first");

    // transient providers never own constructed values, so rebinding stays allowed
    container.bind({ token: token, scope: "Transient", factory: () => "second" });

    expect(container.get(token)).toBe("second");
  });

  it("should construct a transient instance descriptor fresh on every resolution", () => {
    const container = new ContainerKernel();
    const constructed = jest.fn();

    @Injectable()
    class MyService {
      public constructor() {
        constructed();
      }
    }

    container.bind({ token: MyService, type: "Instance", value: MyService, scope: "Transient" });

    const first = container.get(MyService);
    const second = container.get(MyService);

    expect(first).toBeInstanceOf(MyService);
    expect(first).not.toBe(second);
    expect(constructed).toHaveBeenCalledTimes(2);
  });

  it("should resolve a transient instance descriptor fresh through a child container", () => {
    const parent = new ContainerKernel();
    const child = new ContainerKernel(parent);

    @Injectable()
    class MyService {}

    parent.bind({ token: MyService, type: "Instance", value: MyService, scope: "Transient" });

    expect(child.get(MyService)).toBeInstanceOf(MyService);
    expect(child.get(MyService)).not.toBe(child.get(MyService));
  });

  it("should not enforce the lifecycle-handler guard on a bare kernel", () => {
    // The guard lives on Container.bind: a bare kernel runs no activation
    // adapter and no provision, so a transient instance binding whose class declares a
    // handler is allowed here - the handler simply never fires.
    const container = new ContainerKernel();

    @Injectable()
    class MyService {
      @OnDeactivation()
      public onDeactivation(): void {}
    }

    expect(() =>
      container.bind({ token: MyService, type: "Instance", value: MyService, scope: "Transient" })
    ).not.toThrow();
    expect(container.get(MyService)).not.toBe(container.get(MyService));
  });
});
