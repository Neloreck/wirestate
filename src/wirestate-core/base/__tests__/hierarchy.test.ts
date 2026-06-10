import { Container } from "../container/container";
import { NoBindingFoundError } from "../errors";
import { Injectable } from "../injectable";
import { InjectionToken } from "../tokens";

describe("Container hierarchy", () => {
  it("should share singleton identity between parent and child containers", () => {
    const parent = new Container();
    const child = new Container(parent);

    @Injectable()
    class MyService {}

    parent.bind({ token: MyService, type: "Instance", value: MyService });

    const fromChild = child.get(MyService);
    const fromParent = parent.get(MyService);

    expect(fromChild).toBe(fromParent);
  });

  it("should allow children to override parent bindings without affecting the parent", () => {
    const parent = new Container();
    const child = new Container(parent);
    const token = new InjectionToken<string>("value");

    parent.bind({ token: token, value: "parent" });
    child.bind({ token: token, value: "child" });

    expect(child.get(token)).toBe("child");
    expect(parent.get(token)).toBe("parent");
  });

  it("should expose the parent container", () => {
    const parent = new Container();
    const child = new Container(parent);

    expect(child.parent).toBe(parent);
    expect(parent.parent).toBeUndefined();
  });

  it("should distinguish own bindings from inherited bindings", () => {
    const parent = new Container();
    const child = new Container(parent);
    const token = new InjectionToken<string>("value");

    parent.bind({ token: token, value: "parent" });

    expect(child.has(token)).toBe(true);
    expect(child.hasOwn(token)).toBe(false);
    expect(parent.hasOwn(token)).toBe(true);

    child.bind({ token: token, value: "child" });

    expect(child.hasOwn(token)).toBe(true);
  });

  it("should not deactivate parent-owned values when a child unbinds", () => {
    const parent = new Container();
    const child = new Container(parent);
    const onDeactivated = jest.fn();

    @Injectable()
    class MyService {}

    parent.bind({ token: MyService, type: "Instance", value: MyService, onDeactivated });

    child.get(MyService);
    child.unbind(MyService);

    expect(onDeactivated).not.toHaveBeenCalled();
    expect(parent.get(MyService)).toBeInstanceOf(MyService);
  });
});

describe("Explicit bindings", () => {
  it("should not resolve unbound classes", () => {
    const container = new Container();

    class MyService {}

    expect(() => container.get(MyService)).toThrow(NoBindingFoundError);
    expect(container.get(MyService, { optional: true })).toBeUndefined();
  });

  it("should resolve explicit bindings", () => {
    const container = new Container();

    @Injectable()
    class MyService {}

    container.bind({ token: MyService, type: "Instance", value: MyService });

    expect(container.get(MyService)).toBeInstanceOf(MyService);
  });

  it("should not resolve unbound classes in child containers", () => {
    const parent = new Container();
    const child = new Container(parent);

    class MyService {}

    expect(() => child.get(MyService)).toThrow(NoBindingFoundError);
  });
});
