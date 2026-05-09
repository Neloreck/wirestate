import { Inject, Injectable, OnActivated, OnDeactivation, OnEvent, WireScope, Event } from "@wirestate/core";
import { signal, State, computed } from "@wirestate/lit-signals";

import { EGlobalEvent } from "@/constants/events";

interface CounterServiceSeed {
  count?: number;
}

@Injectable()
export class CounterService {
  public count: State<number> = signal(0);

  public isEven = computed(() => this.count.get() % 2 === 0);

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope
  ) {
    const seed = scope.getSeed<CounterServiceSeed>(CounterService);

    console.log(`[${this.constructor.name}] constructing with seed:`, seed);

    if (typeof seed?.count === "number") {
      console.log(`[${this.constructor.name}] apply seed count:`, seed.count);
      this.count.set(seed.count);
    }
  }

  @OnActivated()
  public onActivated(): void {
    console.log(`[${this.constructor.name}] onActivated`);

    // [*] Pass safe lifecycle checks - can emit from activation.
    this.scope.emitEvent(`activated/${this.constructor.name}`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.log(`[${this.constructor.name}] onDeactivation`);
  }

  public increment(): void {
    this.count.set(this.count.get() + 1);
  }

  @OnEvent(EGlobalEvent.COUNTER_INCREMENT)
  public onCounterIncrement(event: Event<number>): void {
    this.count.set(this.count.get() + (event.payload ?? 1));
  }
}
