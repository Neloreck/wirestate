import { Container } from "../container/container";
import { inject } from "../context";
import { InjectionToken } from "../tokens";

describe("Binding lifecycle hooks", () => {
  describe("onActivated", () => {
    it("should run once for singleton bindings with instance and container", () => {
      const container = new Container();
      const onActivated = jest.fn();

      class MyService {}

      container.bind({ token: MyService, type: "Instance", value: MyService, onActivated });

      const instance = container.get(MyService);

      container.get(MyService);

      expect(onActivated).toHaveBeenCalledTimes(1);
      expect(onActivated).toHaveBeenCalledWith(instance, container);
    });

    it("should run for every construction of transient bindings", () => {
      const container = new Container();
      const onActivated = jest.fn();

      class MyService {}

      container.bind({ token: MyService, type: "Instance", value: MyService, scope: "Transient", onActivated });

      container.get(MyService);
      container.get(MyService);

      expect(onActivated).toHaveBeenCalledTimes(2);
    });

    it("should replace the constructed value when returning a value", () => {
      const container = new Container();
      const token = new InjectionToken<string>("message");

      container.bind({
        token: token,
        factory: () => "original",
        onActivated: (value) => `${value}-wrapped`,
      });

      expect(container.get(token)).toBe("original-wrapped");
    });

    it("should run for constant value bindings on first resolution", () => {
      const container = new Container();
      const token = new InjectionToken<object>("value");
      const onActivated = jest.fn();
      const value = {};

      container.bind({ token: token, value: value, onActivated });

      expect(onActivated).not.toHaveBeenCalled();

      container.get(token);
      container.get(token);

      expect(onActivated).toHaveBeenCalledTimes(1);
      expect(onActivated).toHaveBeenCalledWith(value, container);
    });
  });

  describe("onDeactivated", () => {
    it("should run on unbind for constructed singletons", () => {
      const container = new Container();
      const onDeactivated = jest.fn();

      class MyService {}

      container.bind({ token: MyService, type: "Instance", value: MyService, onDeactivated });

      const instance = container.get(MyService);

      container.unbind(MyService);

      expect(onDeactivated).toHaveBeenCalledTimes(1);
      expect(onDeactivated).toHaveBeenCalledWith(instance, container);
    });

    it("should not run when the binding never constructed a value", () => {
      const container = new Container();
      const onDeactivated = jest.fn();

      class MyService {}

      container.bind({ token: MyService, type: "Instance", value: MyService, onDeactivated });
      container.unbind(MyService);

      expect(onDeactivated).not.toHaveBeenCalled();
    });

    it("should not run for transient values", () => {
      const container = new Container();
      const onDeactivated = jest.fn();

      class MyService {}

      container.bind({ token: MyService, type: "Instance", value: MyService, scope: "Transient", onDeactivated });

      container.get(MyService);
      container.unbind(MyService);

      expect(onDeactivated).not.toHaveBeenCalled();
    });

    it("should allow rebinding and reconstruction after unbind", () => {
      const container = new Container();
      const token = new InjectionToken<object>("value");

      container.bind({ token: token, factory: () => ({}) });

      const first = container.get(token);

      container.unbind(token);
      container.bind({ token: token, factory: () => ({}) });

      expect(container.get(token)).not.toBe(first);
    });

    it("should deactivate only values of the unbound token", () => {
      const container = new Container();
      const deactivations: Array<string> = [];

      class FooService {}

      class BarService {}

      container.bind({
        token: FooService,
        type: "Instance",
        value: FooService,
        onDeactivated: () => deactivations.push("foo"),
      });
      container.bind({
        token: BarService,
        type: "Instance",
        value: BarService,
        onDeactivated: () => deactivations.push("bar"),
      });

      container.get(FooService);
      container.get(BarService);
      container.unbind(FooService);

      expect(deactivations).toEqual(["foo"]);
    });

    it("should deactivate in creation order on unbindAll", () => {
      const container = new Container();
      const deactivations: Array<string> = [];

      class BarService {}

      class FooService {
        public constructor(public readonly bar: BarService = inject(BarService)) {}
      }

      container.bind({
        token: BarService,
        type: "Instance",
        value: BarService,
        onDeactivated: () => deactivations.push("bar"),
      });
      container.bind({
        token: FooService,
        type: "Instance",
        value: FooService,
        onDeactivated: () => deactivations.push("foo"),
      });

      // constructing FooService constructs BarService first
      container.get(FooService);
      container.unbindAll();

      expect(deactivations).toEqual(["bar", "foo"]);
    });

    it("should keep bindings resolvable while unbindAll deactivation handlers run", () => {
      const container = new Container();
      const resolved: Array<unknown> = [];

      class FooService {}

      class BarService {}

      container.bind({
        token: FooService,
        type: "Instance",
        value: FooService,
        onDeactivated: (instance, current) => resolved.push(current.get(BarService)),
      });
      container.bind({ token: BarService, type: "Instance", value: BarService });

      container.get(FooService);

      const bar = container.get(BarService);

      container.unbindAll();

      expect(resolved).toEqual([bar]);
    });

    it("should not deactivate values resolved through service redirections twice", () => {
      const container = new Container();
      const onDeactivated = jest.fn();
      const alias = new InjectionToken<MyService>("alias");

      class MyService {}

      container.bind({ token: MyService, type: "Instance", value: MyService, onDeactivated });
      container.bind({ token: alias, service: MyService });

      container.get(alias);
      container.unbind(alias);

      expect(onDeactivated).not.toHaveBeenCalled();

      container.unbindAll();

      expect(onDeactivated).toHaveBeenCalledTimes(1);
    });
  });
});
