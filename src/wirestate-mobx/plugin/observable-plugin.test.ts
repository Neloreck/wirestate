import { Container, Injectable, OnActivation } from "@wirestate/core";

import { Action, Observable, isObservableObject, isObservableProp, makeObservable } from "../index";

import { ObservablePlugin } from "./observable-plugin";

describe("ObservablePlugin", () => {
  it("applies recorded annotations at activation, before the service's own @OnActivation", () => {
    let observableDuringActivation: boolean = false;

    @Injectable()
    class CounterService {
      @Observable()
      public count: number = 0;

      @OnActivation()
      public onActivation(): void {
        observableDuringActivation = isObservableProp(this, "count");
      }

      @Action()
      public increment(): void {
        this.count += 1;
      }
    }

    const container: Container = new Container({ bindings: [CounterService], plugins: [new ObservablePlugin()] });
    const service: CounterService = container.get(CounterService);

    expect(observableDuringActivation).toBe(true);
    expect(isObservableProp(service, "count")).toBe(true);

    service.increment();

    expect(service.count).toBe(1);
  });

  it("covers services activated in child containers through the parent's plugin", () => {
    @Injectable()
    class ChildService {
      @Observable()
      public value: string = "";
    }

    const parent: Container = new Container({ plugins: [new ObservablePlugin()] });
    const child: Container = new Container({ parent, bindings: [ChildService] });

    expect(isObservableProp(child.get(ChildService), "value")).toBe(true);
  });

  it("applies annotations inherited from a base class", () => {
    class BaseService {
      @Observable()
      public base: number = 0;
    }

    @Injectable()
    class DerivedService extends BaseService {}

    const container: Container = new Container({ bindings: [DerivedService], plugins: [new ObservablePlugin()] });

    expect(isObservableProp(container.get(DerivedService), "base")).toBe(true);
  });

  it("leaves a service without annotations alone", () => {
    @Injectable()
    class PlainService {
      public value: number = 0;
    }

    const container: Container = new Container({ bindings: [PlainService], plugins: [new ObservablePlugin()] });

    expect(isObservableObject(container.get(PlainService))).toBe(false);
  });

  it("stays compatible with a service that calls makeObservable in its constructor", () => {
    @Injectable()
    class LegacyService {
      @Observable()
      public count: number = 0;

      public constructor() {
        makeObservable(this);
      }
    }

    const container: Container = new Container({ bindings: [LegacyService], plugins: [new ObservablePlugin()] });

    expect(() => container.get(LegacyService)).not.toThrow();
    expect(isObservableProp(container.get(LegacyService), "count")).toBe(true);
  });
});
