import {
  Inject,
  Injectable,
  OnActivated,
  OnDeactivation,
  OnEvent,
  WireScope,
  Event,
  OnQuery,
  OnProvision,
  OnDeprovision,
} from "@wirestate/core";
import { signal, State, computed } from "@wirestate/lit-signals";

import { EGlobalEvent } from "@/constants/events";
import { ECounterServiceQuery, ICounterSnapshot, ICounterSummary } from "@/services/CounterService.query";
import { LoggerService } from "@/services/LoggerService";

interface CounterServiceSeed {
  count?: number;
}

@Injectable()
export class CounterService {
  public count: State<number> = signal(0);
  public lastIncrementedAt: number = -1;

  public isEven = computed(() => this.count.get() % 2 === 0);

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope,
    @Inject(LoggerService)
    private readonly loggerService: LoggerService
  ) {}

  @OnActivated()
  public onActivated(): void {
    console.log(`[${this.constructor.name}] Activated`);

    const seed = this.scope.getSeed<CounterServiceSeed>(CounterService);

    if (typeof seed?.count === "number") {
      console.log(`[${this.constructor.name}] Apply seed count:`, seed.count);
      this.count.set(seed.count);
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

  public reset(): void {
    console.info(`[${this.constructor.name}] Reset counter`);

    this.count.set(0);
    this.scope.emitEvent(EGlobalEvent.COUNTER_RESET);
  }

  public increment(): void {
    this.lastIncrementedAt = Date.now();
    this.count.set(this.count.get() + 1);
  }

  @OnEvent(EGlobalEvent.COUNTER_INCREMENT)
  public onCounterIncrement(event: Event<number>): void {
    this.lastIncrementedAt = Date.now();
    this.count.set(this.count.get() + (event.payload ?? 1));
  }

  /**
   * Synchronous query handler. Any caller — another service, a React
   * component via `useQueryCaller`, or `query()` from bootstrap — can pull
   * a fresh summary on demand.
   */
  @OnQuery(ECounterServiceQuery.GET_COUNTER_SUMMARY)
  public provideCounterSummary(data?: object): ICounterSummary {
    this.scope.resolve(LoggerService).log(`[${this.constructor.name}][query] Fetching sync snapshot:`, data);

    return {
      count: this.count.get(),
      lastIncrementedAt: this.lastIncrementedAt,
    };
  }

  /**
   * Async query handler — simulates a network round-trip. Callers can
   * simply `await` the return of `queryData` / `useQueryCaller` without
   * caring whether the responder is sync or async.
   */
  @OnQuery(ECounterServiceQuery.FETCH_COUNTER_SNAPSHOT)
  public async fetchCounterSnapshot(): Promise<ICounterSnapshot> {
    this.loggerService.log(`[${this.constructor.name}][query] Fetching async snapshot`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      count: this.count.get(),
      lastIncrementedAt: this.lastIncrementedAt,
      fetchedAt: Date.now(),
    };
  }
}
