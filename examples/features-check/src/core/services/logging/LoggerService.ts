import { GLOBAL_CONFIG } from "@/core/id";
import { EGlobalQuery } from "@/core/queries";
import { CounterService } from "@/core/services/counter/CounterService";
import { ThemeService } from "@/core/services/theme/ThemeService";
import { EGlobalSignal } from "@/core/signals";
import {
  AbstractService,
  Action,
  Inject,
  Injectable,
  makeObservable,
  OnQuery,
  OnSignal,
  ShallowObservable,
  type Signal,
} from "@/libs/wirestate";

export interface ILogEntry {
  readonly id: number;
  readonly type: string;
  readonly payload: unknown;
  readonly at: number;
}

@Injectable()
export class LoggerService extends AbstractService {
  public static readonly MAX_ENTRIES: number = 25;

  @ShallowObservable()
  public entries: Array<ILogEntry> = [];

  private nextId: number = 1;

  public constructor(
    @Inject(GLOBAL_CONFIG)
    protected readonly globalConfig: object,
  ) {
    super();

    makeObservable(this);

    console.info(
      `[${this.constructor.name}] Constructing with constant global config:`,
      globalConfig,
    );
  }

  public override onActivated(): void {
    console.info(
      `[${this.constructor.name}] Activated — listening for signals`,
    );
  }

  public override onDeactivated(): void {
    console.info(`[${this.constructor.name}] Deactivated`);

    this.clear();
  }

  // [*] pass check - subscribe to all signals if needed, no declaration - no sub
  public override onSignal(signal: Signal): void {
    this.saveSignalLogEntry(signal);
  }

  @Action()
  public clear(): void {
    this.entries = [];
    this.nextId = 1;
  }

  @Action()
  private saveSignalLogEntry(signal: Signal): void {
    const entry: ILogEntry = {
      id: this.nextId++,
      type:
        typeof signal.type === "symbol" ? signal.type.toString() : signal.type,
      payload: signal.payload,
      at: Date.now(),
    };

    const next: Array<ILogEntry> = [entry, ...this.entries];

    if (next.length > LoggerService.MAX_ENTRIES) {
      next.length = LoggerService.MAX_ENTRIES;
    }

    this.entries = next;
  }

  public log(...args: Array<unknown>): void {
    window.console.log("[log]", ...args);
  }

  @OnSignal(EGlobalSignal.DUMP)
  public onDump(): void {
    // [*] Pass circular refs check with delayed get:
    console.info(
      `[${this.constructor.name}] Dumping services:`,
      this.resolve(LoggerService),
      this.resolve(ThemeService),
      this.resolve(CounterService),
      this.resolve(GLOBAL_CONFIG),
    );
  }

  @OnSignal([
    /* [*] Pass extensive check - allow multiple signals passing here in array: */
    EGlobalSignal.COUNTER_RESET,
  ])
  public onReset(signal: Signal): void {
    this.log(
      `[${this.constructor.name}] Observed [onReset] signal:`,
      signal.type,
    );
  }

  @OnQuery(EGlobalQuery.GET_RECENT_LOGS)
  public onQueryRecentLogs(data?: { limit?: number }): Array<ILogEntry> {
    return this.entries.slice(0, data?.limit ?? 5);
  }
}
