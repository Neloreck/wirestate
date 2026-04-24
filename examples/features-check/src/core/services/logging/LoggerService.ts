import { EGlobalCommand } from "@/core/commands";
import {
  GLOBAL_CONFIG,
  GLOBAL_DYNAMIC_CONFIG,
  GLOBAL_NOT_EXISTING_CONFIG,
} from "@/core/id";
import { EGlobalQuery } from "@/core/queries";
import { CounterService } from "@/core/services/counter/CounterService";
import { ThemeService } from "@/core/services/theme/ThemeService";
import { EGlobalSignal } from "@/core/signals";
import {
  AbstractService,
  Action,
  Inject,
  Injectable,
  OnActivated,
  OnDeactivation,
  OnQuery,
  Optional,
  OnSignal,
  ShallowObservable,
  makeObservable,
  type Signal,
  OnCommand,
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
  public logs: Array<ILogEntry> = [];

  private nextId: number = 1;

  public constructor(
    @Inject(GLOBAL_CONFIG)
    protected readonly globalConfig: object,
    @Inject(GLOBAL_DYNAMIC_CONFIG)
    protected readonly globalDynamicConfig: object,
    @Optional()
    @Inject(GLOBAL_NOT_EXISTING_CONFIG)
    protected readonly globalNotExistingConfig?: object,
  ) {
    super();

    makeObservable(this);

    console.info(
      `[${this.constructor.name}] Constructing with constant global configs:`,
      { globalConfig, globalDynamicConfig, globalNotExistingConfig },
    );
  }

  @OnActivated()
  public onActivated(): void {
    console.info(
      `[${this.constructor.name}] Activated — listening for signals, seed:`,
      this.getSeed(LoggerService),
    );

    // [*] Pass safe lifecycle checks - can emit from activation.
    this.emitSignal(`activated/${this.constructor.name}`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivating`);

    // [*] Pass safe lifecycle checks - can emit from deactivation.
    this.emitSignal(`deactivating/${this.constructor.name}`);

    this.clear();
  }

  // [*] pass check - subscribe to all signals if needed, no declaration - no sub
  public override onSignal(signal: Signal): void {
    this.saveSignalLogEntry(signal);
  }

  @Action()
  public clear(): void {
    this.logs = [];
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

    const next: Array<ILogEntry> = [entry, ...this.logs];

    if (next.length > LoggerService.MAX_ENTRIES) {
      next.length = LoggerService.MAX_ENTRIES;
    }

    this.logs = next;
  }

  public log(...args: Array<unknown>): void {
    window.console.log("[log]", ...args);
  }

  @OnCommand(EGlobalCommand.DUMP_DATA)
  public onDump(params: unknown): object {
    // [*] Pass circular refs check with delayed get:
    const dump = {
      params,
      [LoggerService.name]: this.resolve(LoggerService),
      [ThemeService.name]: this.resolve(ThemeService),
      [CounterService.name]: this.resolve(CounterService),
      ["GLOBAL_CONFIG"]: this.resolve(GLOBAL_CONFIG),
    };

    console.info(`[${this.constructor.name}] Dumping data:`, dump);

    return dump;
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
    return this.logs.slice(0, data?.limit ?? 5);
  }
}
