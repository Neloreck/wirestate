import {
  Injectable,
  OnActivated,
  OnDeactivation,
  OnDeprovision,
  OnEvent,
  OnProvision,
  OnQuery,
  SEED,
  WireScope,
  inject,
} from "@wirestate/core";
import { type ReadonlySignal, Signal, computed, signal } from "@wirestate/signals";

import { EGlobalEvent } from "@/constants/events";
import { LoggerService } from "@/services/LoggerService";
import type { Optional } from "@/types";

import { ECounterServiceQuery, type ICounterSnapshot, type ICounterSummary } from "./CounterService.query";

export interface ICounterSeed {
  readonly count?: number;
  readonly lastIncrementAt?: Optional<number>;
}

@Injectable()
export class CounterService {
  public readonly count: Signal = signal(0);
  public readonly lastIncrementAt: Signal<Optional<number>> = signal(null);
  public readonly isEven: ReadonlySignal<boolean> = computed(() => this.count.value % 2 === 0);

  public constructor(
    private readonly scope: WireScope = inject(WireScope),
    private readonly loggerService: LoggerService = inject(LoggerService),
    protected readonly seed: object = inject(SEED),
  ) {
    console.info(`[${this.constructor.name}] Shared seed on construction:`, seed);
  }

  @OnActivated()
  public onActivated(): void {
    console.info(`[${this.constructor.name}] Activated`);

    this.initializeFromSeed();
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivation`);
  }

  @OnProvision()
  public onProvision(): void {
    console.info(`[${this.constructor.name}] Provision`);

    this.scope.emitEvent(`provision/${this.constructor.name}`, {
      at: new Date(),
    });
  }

  @OnDeprovision()
  public onDeprovision(): void {
    console.info(`[${this.constructor.name}] Deprovision`);

    this.scope.emitEvent(`deprovision/${this.constructor.name}`, {
      at: new Date(),
    });
  }

  private initializeFromSeed(): void {
    const seed: Optional<ICounterSeed> = this.scope.getSeed(CounterService);

    console.info(`[${this.constructor.name}] Seed from current DI context:`, seed);

    if (seed) {
      if (typeof seed.count === "number") {
        this.count.value = seed.count;
      }

      if (typeof seed.lastIncrementAt === "number") {
        this.lastIncrementAt.value = seed.lastIncrementAt;
      }
    }
  }

  public increment(): void {
    // or this.resolve(LoggerService) to avoid circular refs
    this.loggerService.log(`[${this.constructor.name}][action] Incrementing counter`);

    this.count.value += 1;
    this.lastIncrementAt.value = Date.now();

    this.scope.emitEvent(EGlobalEvent.COUNTER_INCREMENTED, {
      count: this.count.value,
    });
  }

  public reset(): void {
    console.info(`[${this.constructor.name}] Reset counter`);

    this.count.value = 0;
    this.lastIncrementAt.value = null;

    this.scope.emitEvent(EGlobalEvent.COUNTER_RESET);
  }

  @OnEvent(EGlobalEvent.USER_PINGED)
  public onUserPinged(): void {
    this.increment();
  }

  /*
   * Synchronous query handler. Any caller — another service, a React
   * component via `useQueryExecutor`, or `query()` from bootstrap — can pull
   * a fresh summary on demand.
   */
  @OnQuery(ECounterServiceQuery.GET_COUNTER_SUMMARY)
  public provideCounterSummary(data?: object): ICounterSummary {
    this.loggerService.log(`[${this.constructor.name}][query] Fetching sync snapshot:`, data);

    return {
      count: this.count.value,
      isEven: this.isEven.value,
      lastIncrementAt: this.lastIncrementAt.value,
    };
  }

  /*
   * Async query handler — simulates a network round-trip. Callers can
   * simply `await` the return of `query` / `useAsyncQueryExecutor` without
   * caring whether the responder is sync or async.
   */
  @OnQuery(ECounterServiceQuery.FETCH_COUNTER_SNAPSHOT)
  public async fetchCounterSnapshot(): Promise<ICounterSnapshot> {
    this.loggerService.log(`[${this.constructor.name}][query] Fetching async snapshot`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      count: this.count.value,
      isEven: this.isEven.value,
      lastIncrementAt: this.lastIncrementAt.value,
      fetchedAt: Date.now(),
    };
  }
}
