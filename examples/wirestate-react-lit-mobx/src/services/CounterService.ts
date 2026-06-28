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
import { Computed, Observable, makeObservable, BoundAction } from "@wirestate/mobx";

import { EGlobalEvent } from "@/constants/events";
import { ECounterServiceQuery, type ICounterSnapshot, type ICounterSummary } from "@/services/CounterService.query";
import { LoggerService } from "@/services/LoggerService";
import { type Optional } from "@/types";

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  @Observable()
  public lastIncrementAt: Optional<number> = null;

  public constructor(
    private readonly eventBus: EventBus = inject(EventBus),
    private readonly loggerService: LoggerService = inject(LoggerService),
  ) {
    makeObservable(this);
  }

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

  @Computed()
  public get isEven(): boolean {
    return this.count % 2 === 0;
  }

  @BoundAction()
  public increment(): void {
    this.loggerService.log(`[${this.constructor.name}][action] Incrementing counter`);

    this.count += 1;
    this.lastIncrementAt = Date.now();

    this.eventBus.emit(EGlobalEvent.COUNTER_INCREMENTED, {
      count: this.count,
    });
  }

  @BoundAction()
  public reset(): void {
    console.info(`[${this.constructor.name}] Reset counter`);

    this.count = 0;
    this.lastIncrementAt = null;

    this.eventBus.emit(EGlobalEvent.COUNTER_RESET);
  }

  @OnEvent(EGlobalEvent.USER_PINGED)
  public onUserPinged(): void {
    this.increment();
  }

  /*
   * Synchronous query handler. Any caller — another service, a React
   * component via the injected `QueryBus`, or `query()` from bootstrap — can pull
   * a fresh summary on demand.
   */
  @OnQuery(ECounterServiceQuery.GET_COUNTER_SUMMARY)
  public provideCounterSummary(data?: object): ICounterSummary {
    this.loggerService.log(`[${this.constructor.name}][query] Fetching sync snapshot:`, data);

    return {
      count: this.count,
      isEven: this.isEven,
      lastIncrementAt: this.lastIncrementAt,
    };
  }

  /*
   * Async query handler — simulates a network round-trip. Callers can
   * simply `await` the return of `query` / `queryAsync` without
   * caring whether the responder is sync or async.
   */
  @OnQuery(ECounterServiceQuery.FETCH_COUNTER_SNAPSHOT)
  public async fetchCounterSnapshot(): Promise<ICounterSnapshot> {
    this.loggerService.log(`[${this.constructor.name}][query] Fetching async snapshot`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      count: this.count,
      isEven: this.isEven,
      lastIncrementAt: this.lastIncrementAt,
      fetchedAt: Date.now(),
    };
  }
}
