import {
  Injectable,
  OnActivated,
  OnDeactivation,
  WireEvent,
  OnEvent,
  OnCommand,
  OnQuery,
  OnProvision,
  OnDeprovision,
  inject,
  EventBus,
  Container,
} from "@wirestate/core";
import { Action, makeObservable, ShallowObservable } from "@wirestate/mobx";

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

  @ShallowObservable()
  public logs: Array<ILogEntry> = [];

  private nextId: number = 1;

  public constructor(
    private readonly container: Container = inject(Container),
    private readonly eventBus: EventBus = inject(EventBus),
    protected readonly globalConfig: object = inject(GLOBAL_CONFIG),
    protected readonly globalDynamicConfig: object = inject(GLOBAL_DYNAMIC_CONFIG),
    protected readonly globalNotExistingConfig: object | undefined = inject(GLOBAL_NOT_EXISTING_CONFIG, {
      optional: true,
    })
  ) {
    makeObservable(this);

    console.info(`[${this.constructor.name}] Constructing with constant global configs:`, {
      globalConfig,
      globalDynamicConfig,
      globalNotExistingConfig,
    });
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
    console.info(`[${this.constructor.name}] Provision — listening for events`);

    this.eventBus.emit(`provision/${this.constructor.name}`);
  }

  @OnDeprovision()
  public onDeprovision(): void {
    console.info(`[${this.constructor.name}] Deprovision`);

    this.eventBus.emit(`deprovision/${this.constructor.name}`);

    this.clear();
  }

  @Action()
  public clear(): void {
    this.logs = [];
    this.nextId = 1;
  }

  @Action()
  private saveEventLogEntry(event: WireEvent): void {
    const entry: ILogEntry = {
      id: this.nextId++,
      type: String(event.type),
      payload: event.payload,
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
    const dump = {
      params,
      [ThemeService.name]: this.container.get(ThemeService),
      ["GLOBAL_CONFIG"]: this.container.get(GLOBAL_CONFIG),
    };

    console.info(`[${this.constructor.name}] Dumping data:`, dump);

    return dump;
  }

  @OnEvent()
  public onEvents(event: Event): void {
    console.info(`[${this.constructor.name}] Event received:`, event);

    this.saveEventLogEntry(event);
  }

  @OnEvent([EGlobalEvent.COUNTER_RESET])
  public onReset(event: Event): void {
    this.log(`[${this.constructor.name}] Observed [onReset] event:`, event.type);
  }

  @OnQuery(EGlobalQuery.GET_RECENT_LOGS)
  public onQueryRecentLogs(data?: { limit?: number }): Array<ILogEntry> {
    return this.logs.slice(0, data?.limit ?? 5);
  }
}
