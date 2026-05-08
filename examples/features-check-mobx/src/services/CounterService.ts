import { EGlobalEvent } from "@/constants/events";
import {
  SEED,
  Inject,
  Injectable,
  OnQuery,
  OnEvent,
  OnActivated,
  OnDeactivation,
  WireScope,
} from "@/libs/wirestate";
import {
  Action,
  Computed,
  Observable,
  makeObservable,
} from "@/libs/wirestate/mobx";
import {
  ECounterServiceQuery,
  type ICounterSnapshot,
  type ICounterSummary,
} from "@/services/CounterService.query";
import { LoggerService } from "@/services/LoggerService";
import type { Optional } from "@/types";

export interface ICounterSeed {
  readonly count?: number;
  readonly lastIncrementAt?: Optional<number>;
}

@Injectable()
export class CounterService {
  @Observable()
  public count: number = 0;

  @Observable()
  public lastIncrementAt: Optional<number> = null;

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope,
    @Inject(LoggerService)
    private readonly loggerService: LoggerService,
    @Inject(SEED)
    protected readonly seed: object,
  ) {
    makeObservable(this);

    console.info(
      `[${this.constructor.name}] Shared seed on construction:`,
      seed,
    );
  }

  @OnActivated()
  public onActivated(): void {
    console.info(`[${this.constructor.name}] Activated`);

    this.initializeFromSeed();

    // [*] Pass safe lifecycle checks - can emit from activation.
    this.scope.emitEvent(`activated/${this.constructor.name}`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivating`);

    // [*] Pass safe lifecycle checks - can emit from deactivation.
    this.scope.emitEvent(`deactivating/${this.constructor.name}`);
  }

  @Action()
  private initializeFromSeed(): void {
    const seed: Optional<ICounterSeed> = this.scope.getSeed(CounterService);

    console.info(
      `[${this.constructor.name}] Seed from current DI context:`,
      seed,
    );

    if (seed) {
      if (typeof seed.count === "number") {
        this.count = seed.count;
      }

      if (typeof seed.lastIncrementAt === "number") {
        this.lastIncrementAt = seed.lastIncrementAt;
      }
    }
  }

  @Computed()
  public get isEven(): boolean {
    return this.count % 2 === 0;
  }

  @Action()
  public increment(): void {
    // or this.resolve(LoggerService) to avoid circular refs
    this.loggerService.log(
      `[${this.constructor.name}][action] Incrementing counter`,
    );

    this.count += 1;
    this.lastIncrementAt = Date.now();

    this.scope.emitEvent(EGlobalEvent.COUNTER_INCREMENTED, {
      count: this.count,
    });
  }

  @Action()
  public reset(): void {
    console.info(`[${this.constructor.name}] Reset counter`);

    this.count = 0;
    this.lastIncrementAt = null;

    this.scope.emitEvent(EGlobalEvent.COUNTER_RESET);
  }

  @OnEvent(EGlobalEvent.USER_PINGED)
  public onUserPinged(): void {
    this.increment();
  }

  /*
   * Synchronous query handler. Any caller — another service, a React
   * component via `useQueryCaller`, or `query()` from bootstrap — can pull
   * a fresh summary on demand.
   */
  @OnQuery(ECounterServiceQuery.GET_COUNTER_SUMMARY)
  public provideCounterSummary(data?: object): ICounterSummary {
    this.loggerService.log(
      `[${this.constructor.name}][query] Fetching sync snapshot:`,
      data,
    );

    return {
      count: this.count,
      isEven: this.isEven,
      lastIncrementAt: this.lastIncrementAt,
    };
  }

  /*
   * Async query handler — simulates a network round-trip. Callers can
   * simply `await` the return of `queryData` / `useQueryCaller` without
   * caring whether the responder is sync or async.
   */
  @OnQuery(ECounterServiceQuery.FETCH_COUNTER_SNAPSHOT)
  public async fetchCounterSnapshot(): Promise<ICounterSnapshot> {
    this.loggerService.log(
      `[${this.constructor.name}][query] Fetching async snapshot`,
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      count: this.count,
      isEven: this.isEven,
      lastIncrementAt: this.lastIncrementAt,
      fetchedAt: Date.now(),
    };
  }
}
