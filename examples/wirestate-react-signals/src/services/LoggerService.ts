import {
  Injectable,
  OnActivated,
  OnCommand,
  OnDeactivation,
  OnDeprovision,
  OnEvent,
  OnProvision,
  OnQuery,
  WireScope,
  type WireEvent,
  inject,
} from "@wirestate/core";
import { Signal, signal } from "@wirestate/signals";

import { EGlobalCommand } from "@/constants/commands";
import { EGlobalEvent } from "@/constants/events";
import { GLOBAL_CONFIG, GLOBAL_DYNAMIC_CONFIG, GLOBAL_NOT_EXISTING_CONFIG } from "@/constants/id";
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
    private readonly scope: WireScope = inject(WireScope),
    protected readonly globalConfig: object = inject(GLOBAL_CONFIG),
    protected readonly globalDynamicConfig: object = inject(GLOBAL_DYNAMIC_CONFIG),
    protected readonly globalNotExistingConfig: object | undefined = inject(GLOBAL_NOT_EXISTING_CONFIG, {
      optional: true,
    }),
  ) {
    console.info(`[${this.constructor.name}] Constructing with constant global configs:`, {
      globalConfig,
      globalDynamicConfig,
      globalNotExistingConfig,
    });
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

  public clear(): void {
    this.logs.value = [];
    this.nextId = 1;
  }

  private saveEventLogEntry(event: WireEvent): void {
    const entry: ILogEntry = {
      id: this.nextId++,
      type: String(event.type),
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

  @OnEvent()
  public onEvents(event: Event): void {
    this.saveEventLogEntry(event);
  }

  @OnEvent([EGlobalEvent.COUNTER_RESET])
  public onReset(event: Event): void {
    this.log(`[${this.constructor.name}] Observed [onReset] event:`, event.type);
  }

  @OnQuery(EGlobalQuery.GET_RECENT_LOGS)
  public onQueryRecentLogs(data?: { limit?: number }): Array<ILogEntry> {
    return this.logs.value.slice(0, data?.limit ?? 5);
  }
}
