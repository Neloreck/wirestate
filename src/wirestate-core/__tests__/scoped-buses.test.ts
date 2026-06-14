import {
  CommandBus,
  Container,
  EventBus,
  inject,
  Injectable,
  OnCommand,
  OnDeprovision,
  OnEvent,
  OnQuery,
  QueryBus,
} from "../index";
import { Optional } from "../types/general";

describe("core scoped buses integration (parent-child separation)", () => {
  const ADD_COMMAND: string = "ADD_COMMAND";
  const COUNT_QUERY: string = "COUNT_QUERY";
  const LOG_EVENT: string = "LOG_EVENT";
  const PARENT_TOKEN: string = "PARENT_TOKEN";
  const SETTINGS_TOKEN: string = "SETTINGS_TOKEN";

  interface SettingsData {
    readonly offset: number;
    readonly label: string;
  }

  @Injectable()
  class ParentCounterService {
    public readonly events: Array<string> = [];
    private count: number = 0;

    public constructor(private readonly container: Container = inject(Container)) {}

    @OnCommand(ADD_COMMAND)
    public add(value: number): number {
      const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

      this.count += value + settings.offset;

      return this.count;
    }

    @OnQuery(COUNT_QUERY)
    public getCount(): string {
      const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

      return `${settings.label}:${this.count}`;
    }

    @OnEvent(LOG_EVENT)
    public onLogEvent(event: { readonly payload?: string }): void {
      this.events.push(`parent:${event.payload ?? "empty"}`);
    }
  }

  @Injectable()
  class ChildCounterService {
    public readonly events: Array<string> = [];
    private count: number = 100;

    public constructor(private readonly container: Container = inject(Container)) {}

    @OnCommand(ADD_COMMAND)
    public add(value: number): number {
      const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

      this.count += value + settings.offset;

      return this.count;
    }

    @OnQuery(COUNT_QUERY)
    public getCount(): string {
      const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

      return `${settings.label}:${this.count}`;
    }

    @OnEvent(LOG_EVENT)
    public onLogEvent(event: { readonly payload?: string }): void {
      this.events.push(`child:${event.payload ?? "empty"}`);
    }
  }

  it("keeps parent and child messaging in separate scope", async () => {
    const parent: Container = new Container({
      activate: [ParentCounterService],
      bindings: [
        EventBus,
        CommandBus,
        QueryBus,
        ParentCounterService,
        { token: PARENT_TOKEN, value: "root-value" },
        { token: SETTINGS_TOKEN, value: { label: "root-label", offset: 1 } },
      ],
    }).provision();

    const child: Container = new Container({
      activate: [ChildCounterService],
      bindings: [
        EventBus,
        CommandBus,
        QueryBus,
        ChildCounterService,
        { token: SETTINGS_TOKEN, value: { label: "child-label", offset: 10 } },
      ],
      parent: parent,
    }).provision();

    expect(child.get(PARENT_TOKEN)).toBe("root-value");
    expect(child.get(EventBus)).not.toBe(parent.get(EventBus));
    expect(child.get(CommandBus)).not.toBe(parent.get(CommandBus));
    expect(child.get(QueryBus)).not.toBe(parent.get(QueryBus));

    expect(parent.get(CommandBus).execute(ADD_COMMAND, 2)).toBe(3);
    expect(child.get(CommandBus).execute(ADD_COMMAND, 2)).toBe(112);
    expect(parent.get(QueryBus).query(COUNT_QUERY)).toBe("root-label:3");
    expect(child.get(QueryBus).query(COUNT_QUERY)).toBe("child-label:112");

    parent.get(EventBus).emit(LOG_EVENT, "from-parent");
    child.get(EventBus).emit(LOG_EVENT, "from-child");

    expect(parent.get(ParentCounterService).events).toEqual(["parent:from-parent"]);
    expect(child.get(ChildCounterService).events).toEqual(["child:from-child"]);

    child.unbindAll();

    expect(parent.get(CommandBus).execute(ADD_COMMAND, 2)).toBe(6);
    expect(parent.get(QueryBus).query(COUNT_QUERY)).toBe("root-label:6");

    parent.get(EventBus).emit(LOG_EVENT, "from-parent");
    expect(parent.get(ParentCounterService).events).toEqual(["parent:from-parent", "parent:from-parent"]);
  });

  it("keeps scoped essentials available while services deprovision", async () => {
    const DEACTIVATE_COMMAND: string = "DEACTIVATE_COMMAND";
    const DEACTIVATE_EVENT: string = "DEACTIVATE_EVENT";
    const DEACTIVATE_QUERY: string = "DEACTIVATE_QUERY";

    const logs: Array<string> = [];

    let commandResult: Optional<Promise<string>> = null as Optional<Promise<string>>;

    @Injectable()
    class CleanupService {
      public constructor(
        private readonly container: Container = inject(Container),
        private readonly eventBus: EventBus = inject(EventBus),
        private readonly queryBus: QueryBus = inject(QueryBus),
        private readonly commandBus: CommandBus = inject(CommandBus)
      ) {}

      @OnDeprovision()
      public onDeprovision(): void {
        const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

        logs.push(`settings:${settings.label}`);
        this.eventBus.emit(DEACTIVATE_EVENT, "cleanup");
        logs.push(`query-result:${this.queryBus.query(DEACTIVATE_QUERY)}`);

        commandResult = this.commandBus.executeAsync<string>(DEACTIVATE_COMMAND);
      }

      @OnCommand(DEACTIVATE_COMMAND)
      public onCommand(): string {
        logs.push("command");

        return "command-result";
      }

      @OnQuery(DEACTIVATE_QUERY)
      public onQuery(): string {
        logs.push("query");

        return "query-result";
      }

      @OnEvent(DEACTIVATE_EVENT)
      public onEvent(event: { readonly payload?: string }): void {
        logs.push(`event:${event.payload ?? "empty"}`);
      }
    }

    const container: Container = new Container({
      activate: [CleanupService],
      bindings: [
        EventBus,
        CommandBus,
        QueryBus,
        CleanupService,
        { token: SETTINGS_TOKEN, value: { label: "cleanup-label", offset: 0 } },
      ],
    })
      .provision()
      .unbindAll();

    expect(logs).toEqual(["settings:cleanup-label", "event:cleanup", "query", "query-result:query-result", "command"]);
    expect(commandResult).not.toBeNull();

    const result: Optional<string> = await commandResult;

    expect(result).toBe("command-result");
    expect(logs).toEqual(["settings:cleanup-label", "event:cleanup", "query", "query-result:query-result", "command"]);
    expect(container.has(CleanupService)).toBe(false);
    expect(container.has(EventBus)).toBe(false);
    expect(container.has(QueryBus)).toBe(false);
    expect(container.has(CommandBus)).toBe(false);
  });

  it("keeps services able to communicate with each other while deprovisioning", async () => {
    const PEER_DEACTIVATE_COMMAND: string = "PEER_DEACTIVATE_COMMAND";
    const PEER_DEACTIVATE_EVENT: string = "PEER_DEACTIVATE_EVENT";
    const PEER_DEACTIVATE_QUERY: string = "PEER_DEACTIVATE_QUERY";

    const logs: Array<string> = [];
    let commandResult: Optional<Promise<string>> = null as Optional<Promise<string>>;

    const fromDeactivationPeerService: Array<unknown> = [];
    const fromDeactivationCoordinatorService: Array<unknown> = [];

    @Injectable()
    class DeactivationPeerService {
      public constructor(private readonly container: Container = inject(Container)) {}

      @OnDeprovision()
      public onDeprovision(): void {
        logs.push("peer-deprovision");

        fromDeactivationPeerService.push(
          this.container.get(Container),
          this.container.get(DeactivationCoordinatorService),
          this.container.get(DeactivationPeerService)
        );
      }

      @OnCommand(PEER_DEACTIVATE_COMMAND)
      public onCommand(value: string): string {
        logs.push(`peer-command:${value}`);

        return "peer-command-result";
      }

      @OnQuery(PEER_DEACTIVATE_QUERY)
      public onQuery(value: string): string {
        logs.push(`peer-query:${value}`);

        return "peer-query-result";
      }

      @OnEvent(PEER_DEACTIVATE_EVENT)
      public onEvent(event: { readonly payload?: string }): void {
        logs.push(`peer-event:${event.payload ?? "empty"}`);
      }
    }

    @Injectable()
    class DeactivationCoordinatorService {
      public constructor(
        private readonly container: Container = inject(Container),
        private readonly eventBus: EventBus = inject(EventBus),
        private readonly queryBus: QueryBus = inject(QueryBus),
        private readonly commandBus: CommandBus = inject(CommandBus)
      ) {}

      @OnDeprovision()
      public onDeprovision(): void {
        logs.push("coordinator-deprovision");
        this.eventBus.emit(PEER_DEACTIVATE_EVENT, "from-coordinator");
        logs.push(`coordinator-query:${this.queryBus.query(PEER_DEACTIVATE_QUERY, "from-coordinator")}`);

        commandResult = this.commandBus.executeAsync<string, string>(PEER_DEACTIVATE_COMMAND, "from-coordinator");

        fromDeactivationCoordinatorService.push(
          this.container.get(Container),
          this.container.get(DeactivationCoordinatorService),
          this.container.get(DeactivationPeerService)
        );
      }
    }

    new Container({
      activate: [DeactivationCoordinatorService, DeactivationPeerService],
      bindings: [EventBus, CommandBus, QueryBus, DeactivationPeerService, DeactivationCoordinatorService],
    })
      .provision()
      .unbindAll();

    expect(logs).toEqual([
      "coordinator-deprovision",
      "peer-event:from-coordinator",
      "peer-query:from-coordinator",
      "coordinator-query:peer-query-result",
      "peer-command:from-coordinator",
      "peer-deprovision",
    ]);
    expect(commandResult).not.toBeNull();

    expect(await commandResult).toBe("peer-command-result");
    expect(logs).toEqual([
      "coordinator-deprovision",
      "peer-event:from-coordinator",
      "peer-query:from-coordinator",
      "coordinator-query:peer-query-result",
      "peer-command:from-coordinator",
      "peer-deprovision",
    ]);

    expect(fromDeactivationCoordinatorService).toHaveLength(3);
    expect(fromDeactivationPeerService).toHaveLength(3);
  });
});
