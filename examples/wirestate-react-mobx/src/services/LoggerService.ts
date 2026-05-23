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
import { OnDeprovision, OnProvision } from "@wirestate/react";
import {
  Action,
  ShallowObservable,
  makeObservable,
} from "@wirestate/react-mobx";

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

  @ShallowObservable()
  public logs: Array<ILogEntry> = [];

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
    makeObservable(this);

    console.info(
      `[${this.constructor.name}] Constructing with constant global configs:`,
      { globalConfig, globalDynamicConfig, globalNotExistingConfig },
    );
  }

  @OnActivated()
  public onActivated(): void {
    console.info(`[${this.constructor.name}] Activated:`);
  }

  @OnDeactivation()
  public onDeactivation(): void {
    console.info(`[${this.constructor.name}] Deactivation`);
  }

  @OnProvision()
  public onProvision(): void {
    console.info(
      `[${this.constructor.name}] Provision — listening for events, seed:`,
      this.scope.getSeed(LoggerService),
    );

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

    this.clear();
  }

  @Action()
  public clear(): void {
    this.logs = [];
    this.nextId = 1;
  }

  @Action()
  private saveEventLogEntry(event: Event): void {
    const next: Array<ILogEntry> = [
      {
        id: this.nextId++,
        type:
          typeof event.type === "symbol" ? event.type.toString() : event.type,
        payload: event.payload,
        at: Date.now(),
      },
      ...this.logs,
    ];

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
    this.saveEventLogEntry(event);
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
    return this.logs.slice(0, data?.limit ?? 5);
  }
}
