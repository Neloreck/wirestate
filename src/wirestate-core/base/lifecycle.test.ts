import { Container } from "./container";
import { inject } from "./context";
import { InjectionToken } from "./tokens";

describe("Provider lifecycle hooks", () => {
  describe("onActivated", () => {
    it("should run once for singleton providers with instance and container", () => {
      const container = new Container();
      const onActivated = jest.fn();

      class MyService {}

      container.bind({ provide: MyService, useClass: MyService, onActivated });

      const instance = container.get(MyService);

      container.get(MyService);

      expect(onActivated).toHaveBeenCalledTimes(1);
      expect(onActivated).toHaveBeenCalledWith(instance, container);
    });

    it("should run for every construction of transient providers", () => {
      const container = new Container();
      const onActivated = jest.fn();

      class MyService {}

      container.bind({ provide: MyService, useClass: MyService, scope: "transient", onActivated });

      container.get(MyService);
      container.get(MyService);

      expect(onActivated).toHaveBeenCalledTimes(2);
    });

    it("should replace the constructed value when returning a value", () => {
      const container = new Container();
      const token = new InjectionToken<string>("message");

      container.bind({
        provide: token,
        useFactory: () => "original",
        onActivated: (value) => `${value}-wrapped`,
      });

      expect(container.get(token)).toBe("original-wrapped");
    });

    it("should run for value providers on first resolution", () => {
      const container = new Container();
      const token = new InjectionToken<object>("value");
      const onActivated = jest.fn();
      const value = {};

      container.bind({ provide: token, useValue: value, onActivated });

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

      container.bind({ provide: MyService, useClass: MyService, onDeactivated });

      const instance = container.get(MyService);

      container.unbind(MyService);

      expect(onDeactivated).toHaveBeenCalledTimes(1);
      expect(onDeactivated).toHaveBeenCalledWith(instance, container);
    });

    it("should not run when the provider never constructed a value", () => {
      const container = new Container();
      const onDeactivated = jest.fn();

      class MyService {}

      container.bind({ provide: MyService, useClass: MyService, onDeactivated });
      container.unbind(MyService);

      expect(onDeactivated).not.toHaveBeenCalled();
    });

    it("should not run for transient values", () => {
      const container = new Container();
      const onDeactivated = jest.fn();

      class MyService {}

      container.bind({ provide: MyService, useClass: MyService, scope: "transient", onDeactivated });

      container.get(MyService);
      container.unbind(MyService);

      expect(onDeactivated).not.toHaveBeenCalled();
    });

    it("should allow rebinding and reconstruction after unbind", () => {
      const container = new Container();
      const token = new InjectionToken<object>("value");

      container.bind({ provide: token, useFactory: () => ({}) });

      const first = container.get(token);

      container.unbind(token);
      container.bind({ provide: token, useFactory: () => ({}) });

      expect(container.get(token)).not.toBe(first);
    });

    it("should deactivate only values of the unbound token", () => {
      const container = new Container();
      const deactivations: Array<string> = [];

      class FooService {}

      class BarService {}

      container.bind({
        provide: FooService,
        useClass: FooService,
        onDeactivated: () => deactivations.push("foo"),
      });
      container.bind({
        provide: BarService,
        useClass: BarService,
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
        provide: BarService,
        useClass: BarService,
        onDeactivated: () => deactivations.push("bar"),
      });
      container.bind({
        provide: FooService,
        useClass: FooService,
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
        provide: FooService,
        useClass: FooService,
        onDeactivated: (instance, current) => resolved.push(current.get(BarService)),
      });
      container.bind({ provide: BarService, useClass: BarService });

      container.get(FooService);

      const bar = container.get(BarService);

      container.unbindAll();

      expect(resolved).toEqual([bar]);
    });

    it("should not deactivate values resolved through alias providers twice", () => {
      const container = new Container();
      const onDeactivated = jest.fn();
      const alias = new InjectionToken<MyService>("alias");

      class MyService {}

      container.bind({ provide: MyService, useClass: MyService, onDeactivated });
      container.bind({ provide: alias, useExisting: MyService });

      container.get(alias);
      container.unbind(alias);

      expect(onDeactivated).not.toHaveBeenCalled();

      container.unbindAll();

      expect(onDeactivated).toHaveBeenCalledTimes(1);
    });
  });
});
