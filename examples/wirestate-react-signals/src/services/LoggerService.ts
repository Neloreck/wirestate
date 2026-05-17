import {
  Inject,
  Injectable,
  OnActivated,
  OnDeactivation,
  OnQuery,
  Optional,
  OnEvent,
  type Event,
  OnCommand,
  WireScope,
} from "@wirestate/core";
import { signal, Signal } from "@wirestate/react-signals";

import { EGlobalCommand } from "@/constants/commands";
import { EGlobalEvent } from "@/constants/events";
import {
  GLOBAL_CONFIG,
  GLOBAL_DYNAMIC_CONFIG,
  GLOBAL_NOT_EXISTING_CONFIG,
} from "@/constants/id";
import { EGlobalQuery } from "@/constants/queries";
import { ThemeService } from "@/services/ThemeService";

export interface ILogEntry {
  readonly id: number;
  readonly type: string;
  readonly payload: unknown;
  readonly at: number;
}

@Injectable()
export class LoggerService {
  public static readonly MAX_ENTRIES: number = 25;

  public readonly logs: Signal<Array<ILogEntry>> = signal([]);

  private nextId: number = 1;

  public constructor(
    @Inject(WireScope)
    private readonly scope: WireScope,
    @Inject(GLOBAL_CONFIG)
    protected readonly globalConfig: object,
    @Inject(GLOBAL_DYNAMIC_CONFIG)
    protected readonly globalDynamicConfig: object,
    @Optional()
    @Inject(GLOBAL_NOT_EXISTING_CONFIG)
    protected readonly globalNotExistingConfig?: object,
  ) {
    console.info(
      `[${this.constructor.name}] Constructing with constant global configs:`,
      { globalConfig, globalDynamicConfig, globalNotExistingConfig },
    );
  }

  @OnActivated()
  public onActivated(): void {
    console.info(
      `[${this.constructor.name}] Activated — listening for events, seed:`,
      this.scope.getSeed(LoggerService),
    );

    // [*] Pass safe lifecycle checks - can emit from activation.
    this.scope.emitEvent(`activated/${this.constructor.name}`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivating`);

    // [*] Pass safe lifecycle checks - can emit from deactivation.
    this.scope.emitEvent(`deactivating/${this.constructor.name}`);

    this.clear();
  }

  public clear(): void {
    this.logs.value = [];
    this.nextId = 1;
  }

  private saveEventLogEntry(event: Event): void {
    const entry: ILogEntry = {
      id: this.nextId++,
      type: typeof event.type === "symbol" ? event.type.toString() : event.type,
      payload: event.payload,
      at: Date.now(),
    };

    const next: Array<ILogEntry> = [entry, ...this.logs.value];

    if (next.length > LoggerService.MAX_ENTRIES) {
      next.length = LoggerService.MAX_ENTRIES;
    }

    this.logs.value = next;
  }

  public log(...args: Array<unknown>): void {
    window.console.log("[log]", ...args);
  }

  @OnCommand(EGlobalCommand.DUMP_DATA)
  public onDump(params: unknown): object {
    const dump = {
      params,
      [ThemeService.name]: this.scope.resolve(ThemeService),
      ["GLOBAL_CONFIG"]: this.scope.resolve(GLOBAL_CONFIG),
    };

    console.info(`[${this.constructor.name}] Dumping data:`, dump);

    return dump;
  }

  // [*] pass check - subscribe to all events if needed, no declaration - no sub
  @OnEvent()
  public onEvents(event: Event): void {
    setTimeout(() => this.saveEventLogEntry(event));
  }

  @OnEvent([
    /* [*] Pass extensive check - allow multiple events passing here in array: */
    EGlobalEvent.COUNTER_RESET,
  ])
  public onReset(event: Event): void {
    this.log(
      `[${this.constructor.name}] Observed [onReset] event:`,
      event.type,
    );
  }

  @OnQuery(EGlobalQuery.GET_RECENT_LOGS)
  public onQueryRecentLogs(data?: { limit?: number }): Array<ILogEntry> {
    return this.logs.value.slice(0, data?.limit ?? 5);
  }
}
