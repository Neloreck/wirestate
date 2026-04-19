import type { Optional } from "@/application/types";
import { LoggerService } from "@/core/services/logging/LoggerService";
import { EGlobalSignal } from "@/core/signals";
import {
  AbstractService,
  Action,
  Computed,
  INITIAL_STATE,
  Inject,
  Injectable,
  makeObservable,
  Observable,
  OnQuery,
  OnSignal,
} from "@/libs/wirestate";

import {
  ECounterServiceQuery,
  type ICounterSnapshot,
  type ICounterSummary,
} from "./CounterService.query";

export interface ICounterInitialState {
  readonly count?: number;
  readonly lastIncrementAt?: Optional<number>;
}

@Injectable()
export class CounterService extends AbstractService {
  @Observable()
  public count: number = 0;

  @Observable()
  public lastIncrementAt: Optional<number> = null;

  public constructor(
    @Inject(LoggerService)
    private readonly loggerService: LoggerService,
    @Inject(INITIAL_STATE)
    protected readonly initialState: object,
  ) {
    super();

    makeObservable(this);

    console.info(
      `[${this.constructor.name}] shared initial state on construction:`,
      initialState,
    );
  }

  public override onActivated(): void {
    console.info(`[${this.constructor.name}] activated`);

    this.onSeedFromInitialState();
  }

  public override onDeactivated(): void {
    console.info(`[${this.constructor.name}] deactivated`);
  }

  @Action()
  private onSeedFromInitialState(): void {
    const initialState: Optional<ICounterInitialState> =
      this.getInitialState<ICounterInitialState>(CounterService);

    console.info(
      `[${this.constructor.name}] seed from initial state:`,
      initialState,
    );

    if (initialState) {
      if (typeof initialState.count === "number") {
        this.count = initialState.count;
      }

      if (typeof initialState.lastIncrementAt === "number") {
        this.lastIncrementAt = initialState.lastIncrementAt;
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
      `[${this.constructor.name}][action] incrementing counter`,
    );

    this.count += 1;
    this.lastIncrementAt = Date.now();

    this.emitSignal({
      type: EGlobalSignal.COUNTER_INCREMENTED,
      payload: { count: this.count },
    });
  }

  @Action()
  public reset(): void {
    this.count = 0;
    this.lastIncrementAt = null;

    this.emitSignal({ type: EGlobalSignal.COUNTER_RESET });
  }

  @OnSignal(EGlobalSignal.USER_PINGED)
  public onUserPinged(): void {
    this.increment();
  }

  /*
   * Synchronous query handler. Any caller — another service, a React
   * component via `useQueryCaller`, or `query()` from bootstrap — can pull
   * a fresh summary on demand.
   */
  @OnQuery(ECounterServiceQuery.GET_COUNTER_SUMMARY)
  public provideCounterSummary(): ICounterSummary {
    this.loggerService.log(
      `[${this.constructor.name}][query] fetching sync snapshot…`,
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
      `[${this.constructor.name}][query] fetching async snapshot`,
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
