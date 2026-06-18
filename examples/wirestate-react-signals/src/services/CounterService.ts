import {
  Injectable,
  OnActivated,
  OnDeactivation,
  OnDeprovision,
  OnEvent,
  OnProvision,
  OnQuery,
  inject,
  EventBus,
} from "@wirestate/core";
import { type ReadonlySignal, Signal, computed, signal } from "@wirestate/signals";

import { EGlobalEvent } from "@/constants/events";
import { LoggerService } from "@/services/LoggerService";
import { type Optional } from "@/types";

import { ECounterServiceQuery, type ICounterSnapshot, type ICounterSummary } from "./CounterService.query";

@Injectable()
export class CounterService {
  public readonly count: Signal = signal(0);
  public readonly lastIncrementAt: Signal<Optional<number>> = signal(null);
  public readonly isEven: ReadonlySignal<boolean> = computed(() => this.count.value % 2 === 0);

  public constructor(
    private readonly eventBus: EventBus = inject(EventBus),
    private readonly loggerService: LoggerService = inject(LoggerService),
  ) {}

  @OnActivated()
  public onActivated(): void {
    console.info(`[${this.constructor.name}] Activated`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivation`);
  }

  @OnProvision()
  public onProvision(): void {
    console.info(`[${this.constructor.name}] Provision`);

    this.eventBus.emit(`provision/${this.constructor.name}`, {
      at: new Date(),
    });
  }

  @OnDeprovision()
  public onDeprovision(): void {
    console.info(`[${this.constructor.name}] Deprovision`);

    this.eventBus.emit(`deprovision/${this.constructor.name}`, {
      at: new Date(),
    });
  }

  public increment(): void {
    this.loggerService.log(`[${this.constructor.name}][action] Incrementing counter`);

    this.count.value += 1;
    this.lastIncrementAt.value = Date.now();

    this.eventBus.emit(EGlobalEvent.COUNTER_INCREMENTED, {
      count: this.count.value,
    });
  }

  public reset(): void {
    console.info(`[${this.constructor.name}] Reset counter`);

    this.count.value = 0;
    this.lastIncrementAt.value = null;

    this.eventBus.emit(EGlobalEvent.COUNTER_RESET);
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
