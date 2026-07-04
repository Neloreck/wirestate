import { OnActivation } from "../activation/on-activation";
import { OnDeactivation } from "../activation/on-deactivation";
import { InjectionToken } from "../binding/binding-tokens";
import { Injectable } from "../metadata/metadata-injectable";

import { Container } from "./container";
import { inject } from "./container-context";

describe("instance lifecycle guarantees", () => {
  it("should activate singleton instance bindings exactly once", () => {
    const events: Array<string> = [];

    @Injectable()
    class MyService {
      @OnActivation()
      public onActivation(): void {
        events.push("activated");
      }
    }

    const container = new Container();

    container.bind({ token: MyService, type: "Instance", value: MyService });

    container.get(MyService);
    container.get(MyService);

    expect(events).toEqual(["activated"]);
  });

  it("should construct transient factory values on every resolution", () => {
    const container = new Container();
    const token = new InjectionToken<{ id: number }>("transient");

    let constructions: number = 0;

    container.bind({ token: token, scope: "Transient", factory: () => ({ id: ++constructions }) });

    expect(container.get(token)).toEqual({ id: 1 });
    expect(container.get(token)).toEqual({ id: 2 });
  });

  it("should deactivate constructed singletons on unbind", () => {
    const events: Array<string> = [];

    @Injectable()
    class MyService {
      @OnDeactivation()
      public onDeactivation(): void {
        events.push("deactivated");
      }
    }

    const container = new Container();

    container.bind({ token: MyService, type: "Instance", value: MyService });
    container.get(MyService);
    container.unbind(MyService);

    expect(events).toEqual(["deactivated"]);
  });

  it("should not deactivate bindings that never constructed a value", () => {
    const events: Array<string> = [];

    @Injectable()
    class MyService {
      @OnDeactivation()
      public onDeactivation(): void {
        events.push("deactivated");
      }
    }

    const container = new Container();

    container.bind({ token: MyService, type: "Instance", value: MyService });
    container.unbind(MyService);

    expect(events).toEqual([]);
  });

  it("should not track transient values for deactivation", () => {
    const events: Array<string> = [];

    @Injectable()
    class MyService {
      @OnDeactivation()
      public onDeactivation(): void {
        events.push("deactivated");
      }
    }

    const container = new Container();

    container.bind({ token: MyService, scope: "Transient", factory: () => new MyService() });

    container.get(MyService);
    container.unbind(MyService);

    expect(events).toEqual([]);
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
    const deactivations: Array<string> = [];

    @Injectable()
    class FooService {
      @OnDeactivation()
      public onDeactivation(): void {
        deactivations.push("foo");
      }
    }

    @Injectable()
    class BarService {
      @OnDeactivation()
      public onDeactivation(): void {
        deactivations.push("bar");
      }
    }

    const container = new Container();

    container.bind({ token: FooService, type: "Instance", value: FooService });
    container.bind({ token: BarService, type: "Instance", value: BarService });

    container.get(FooService);
    container.get(BarService);
    container.unbind(FooService);

    expect(deactivations).toEqual(["foo"]);
  });

  it("should deactivate in reverse creation order on unbindAll", () => {
    const deactivations: Array<string> = [];

    @Injectable()
    class BarService {
      @OnDeactivation()
      public onDeactivation(): void {
        deactivations.push("bar");
      }
    }

    @Injectable()
    class FooService {
      public constructor(public readonly bar: BarService = inject(BarService)) {}

      @OnDeactivation()
      public onDeactivation(): void {
        deactivations.push("foo");
      }
    }

    const container = new Container();

    container.bind({ token: BarService, type: "Instance", value: BarService });
    container.bind({ token: FooService, type: "Instance", value: FooService });

    // Constructing FooService constructs BarService first, so BarService (the dependency)
    // deactivates last: the dependent FooService tears down while BarService is still alive.
    container.get(FooService);
    container.unbindAll();

    expect(deactivations).toEqual(["foo", "bar"]);
  });

  it("should keep bindings resolvable while unbindAll deactivation handlers run", () => {
    const container = new Container();
    const resolved: Array<unknown> = [];

    @Injectable()
    class BarService {}

    @Injectable()
    class FooService {
      @OnDeactivation()
      public onDeactivation(): void {
        resolved.push(container.get(BarService));
      }
    }

    container.bind({ token: FooService, type: "Instance", value: FooService });
    container.bind({ token: BarService, type: "Instance", value: BarService });

    container.get(FooService);

    const bar = container.get(BarService);

    container.unbindAll();

    expect(resolved).toEqual([bar]);
  });
});
