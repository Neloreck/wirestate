import {
  Injectable,
  OnActivated,
  OnDeactivation,
  OnEvent,
  WireScope,
  WireEvent,
  OnQuery,
  OnProvision,
  OnDeprovision,
  inject,
} from "@wirestate/core";
import { Observable, Computed, Action, runInAction, makeObservable } from "@wirestate/mobx";

import { EGlobalEvent } from "@/constants/events";
import { ECounterServiceQuery, ICounterSnapshot, ICounterSummary } from "@/services/CounterService.query";
import { LoggerService } from "@/services/LoggerService";

interface CounterServiceSeed {
  count?: number;
}

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  public lastIncrementedAt: number = -1;

  @Computed()
  public get isEven(): boolean {
    return this.count % 2 === 0;
  }

  public constructor(
    private readonly scope: WireScope = inject(WireScope),
    private readonly loggerService: LoggerService = inject(LoggerService)
  ) {
    makeObservable(this);
  }

  @OnActivated()
  public onActivated(): void {
    console.log(`[${this.constructor.name}] Activated`);

    const seed = this.scope.getSeed<CounterServiceSeed>(CounterService);

    if (typeof seed?.count === "number") {
      console.log(`[${this.constructor.name}] Apply seed count:`, seed.count);
      runInAction(() => (this.count = seed.count as number));
    }
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.log(`[${this.constructor.name}] Deactivation`);
  }

  @OnProvision()
  public onProvision(): void {
    console.log(`[${this.constructor.name}] Provision`);

    this.scope.emitEvent(`provision/${this.constructor.name}`);
  }

  @OnDeprovision()
  public onDeprovision(): void {
    console.log(`[${this.constructor.name}] Deprovision`);

    this.scope.emitEvent(`deprovision/${this.constructor.name}`);
  }

  @Action()
  public reset(): void {
    console.info(`[${this.constructor.name}] Reset counter`);

    this.count = 0;
    this.scope.emitEvent(EGlobalEvent.COUNTER_RESET);
  }

  @Action()
  public increment(): void {
    this.lastIncrementedAt = Date.now();
    this.count += 1;
  }

  @Action()
  @OnEvent(EGlobalEvent.COUNTER_INCREMENT)
  public onCounterIncrement(event: WireEvent<number>): void {
    this.lastIncrementedAt = Date.now();
    this.count = this.count + (event.payload ?? 1);
  }

  /**
   * Synchronous query handler. Any caller — another service, a Lit
   * element via `query`, or `query()` from bootstrap — can pull
   * a fresh summary on demand.
   */
  @OnQuery(ECounterServiceQuery.GET_COUNTER_SUMMARY)
  public provideCounterSummary(data?: object): ICounterSummary {
    this.scope.resolve(LoggerService).log(`[${this.constructor.name}][query] Fetching sync snapshot:`, data);

    return {
      count: this.count,
      lastIncrementedAt: this.lastIncrementedAt,
    };
  }

  /**
   * Async query handler — simulates a network round-trip. Callers can
   * simply `await` the return of `query` without
   * caring whether the responder is sync or async.
   */
  @OnQuery(ECounterServiceQuery.FETCH_COUNTER_SNAPSHOT)
  public async fetchCounterSnapshot(): Promise<ICounterSnapshot> {
    this.loggerService.log(`[${this.constructor.name}][query] Fetching async snapshot`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      count: this.count,
      lastIncrementedAt: this.lastIncrementedAt,
      fetchedAt: Date.now(),
    };
  }
}
