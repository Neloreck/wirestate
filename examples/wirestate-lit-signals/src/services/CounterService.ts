import {
  Injectable,
  OnActivated,
  OnDeactivation,
  OnEvent,
  WireEvent,
  OnQuery,
  OnProvision,
  OnDeprovision,
  inject,
  EventBus,
} from "@wirestate/core";
import { Signal, computed, signal } from "@wirestate/signals";

import { EGlobalEvent } from "@/constants/events";
import { ECounterServiceQuery, ICounterSnapshot, ICounterSummary } from "@/services/CounterService.query";
import { LoggerService } from "@/services/LoggerService";

@Injectable()
export class CounterService {
  public count: Signal<number> = signal(0);
  public lastIncrementedAt: number = -1;

  public isEven = computed(() => this.count.value % 2 === 0);

  public constructor(
    private readonly eventBus: EventBus = inject(EventBus),
    private readonly loggerService: LoggerService = inject(LoggerService)
  ) {}

  @OnActivated()
  public onActivated(): void {
    console.log(`[${this.constructor.name}] Activated`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.log(`[${this.constructor.name}] Deactivation`);
  }

  @OnProvision()
  public onProvision(): void {
    console.log(`[${this.constructor.name}] Provision`);

    this.eventBus.emit(`provision/${this.constructor.name}`);
  }

  @OnDeprovision()
  public onDeprovision(): void {
    console.log(`[${this.constructor.name}] Deprovision`);

    this.eventBus.emit(`deprovision/${this.constructor.name}`);
  }

  public reset(): void {
    console.info(`[${this.constructor.name}] Reset counter`);

    this.count.value = 0;
    this.eventBus.emit(EGlobalEvent.COUNTER_RESET);
  }

  public increment(): void {
    this.lastIncrementedAt = Date.now();
    this.count.value += 1;
  }

  @OnEvent(EGlobalEvent.COUNTER_INCREMENT)
  public onCounterIncrement(event: WireEvent<number>): void {
    this.lastIncrementedAt = Date.now();
    this.count.value = this.count.value + (event.payload ?? 1);
  }

  /**
   * Synchronous query handler. Any caller — another service, a Lit
   * element via `query`, or `query()` from bootstrap — can pull
   * a fresh summary on demand.
   */
  @OnQuery(ECounterServiceQuery.GET_COUNTER_SUMMARY)
  public provideCounterSummary(data?: object): ICounterSummary {
    this.loggerService.log(`[${this.constructor.name}][query] Fetching sync snapshot:`, data);

    return {
      count: this.count.value,
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
      count: this.count.value,
      lastIncrementedAt: this.lastIncrementedAt,
      fetchedAt: Date.now(),
    };
  }
}
