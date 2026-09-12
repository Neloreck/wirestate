import { Container, Injectable, OnActivation } from "@wirestate/core";

import {
  Action,
  Computed,
  Observable,
  autorun,
  isAction,
  isComputedProp,
  isObservableProp,
  makeObservable,
} from "../index";

import { ObservablePlugin } from "./observable-plugin";
import { hasStoredAnnotations } from "./stored-annotations";

describe("ObservablePlugin with TC39 standard decorators", () => {
  it("is not needed: MobX applies annotations during instance initialization", () => {
    let observableDuringActivation: boolean = false;
    const rendered: Array<number> = [];

    @Injectable()
    class CounterService {
      @Observable()
      public accessor count: number = 0;

      @Computed()
      public get doubled(): number {
        return this.count * 2;
      }

      @OnActivation()
      public onActivation(): void {
        observableDuringActivation = isObservableProp(this, "count");
      }

      @Action()
      public increment(): void {
        this.count += 1;
      }
    }

    const container: Container = new Container({ bindings: [CounterService] });
    const service: CounterService = container.get(CounterService);

    autorun(() => rendered.push(service.doubled));

    service.increment();

    expect(observableDuringActivation).toBe(true);
    expect(isObservableProp(service, "count")).toBe(true);
    expect(isComputedProp(service, "doubled")).toBe(true);
    expect(isAction(service.increment)).toBe(true);
    expect(rendered).toEqual([0, 2]);
  });

  it("records no annotations to defer, so the plugin finds nothing to apply", () => {
    @Injectable()
    class CounterService {
      @Observable()
      public accessor count: number = 0;
    }

    expect(hasStoredAnnotations(new CounterService())).toBe(false);
  });

  it("stays a no-op when registered anyway", () => {
    @Injectable()
    class CounterService {
      @Observable()
      public accessor count: number = 5;
    }

    const container: Container = new Container({ bindings: [CounterService], plugins: [new ObservablePlugin()] });
    const service: CounterService = container.get(CounterService);

    expect(isObservableProp(service, "count")).toBe(true);

    service.count = 7;

    expect(service.count).toBe(7);
  });

  it("tolerates a service that still calls makeObservable in its constructor", () => {
    @Injectable()
    class CounterService {
      @Observable()
      public accessor count: number = 1;

      public constructor() {
        makeObservable(this);
      }
    }

    const container: Container = new Container({ bindings: [CounterService] });

    expect(() => container.get(CounterService)).not.toThrow();
    expect(isObservableProp(container.get(CounterService), "count")).toBe(true);
  });

  it("requires the accessor keyword for observable fields", () => {
    expect(() => {
      class CounterService {
        @Observable()
        public count: number = 0;
      }

      return new CounterService();
    }).toThrow(/accessor/);
  });
});
