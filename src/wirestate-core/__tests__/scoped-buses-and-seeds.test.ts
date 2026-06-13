import {
  CommandBus,
  Container,
  EventBus,
  inject,
  Injectable,
  OnCommand,
  OnDeactivation,
  OnEvent,
  OnQuery,
  QueryBus,
  WireScope,
} from "../index";
import { Optional } from "../types/general";

describe("core scoped buses and seeds integration (parent-child separation)", () => {
  const ADD_COMMAND: string = "ADD_COMMAND";
  const COUNT_QUERY: string = "COUNT_QUERY";
  const LOG_EVENT: string = "LOG_EVENT";
  const PARENT_TOKEN: string = "PARENT_TOKEN";
  const SETTINGS_TOKEN: string = "SETTINGS_TOKEN";

  interface SettingsSeed {
    readonly offset: number;
    readonly label: string;
  }

  @Injectable()
  class ParentCounterService {
    public readonly events: Array<string> = [];
    private count: number = 0;

    public constructor(private readonly scope: WireScope = inject(WireScope)) {}

    @OnCommand(ADD_COMMAND)
    public add(value: number): number {
      const settings: SettingsSeed = this.scope.getSeed(SETTINGS_TOKEN) as SettingsSeed;

      this.count += value + settings.offset;

      return this.count;
    }

    @OnQuery(COUNT_QUERY)
    public getCount(): string {
      const settings: SettingsSeed = this.scope.getSeed(SETTINGS_TOKEN) as SettingsSeed;

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

    public constructor(private readonly scope: WireScope = inject(WireScope)) {}

    @OnCommand(ADD_COMMAND)
    public add(value: number): number {
      const settings: SettingsSeed = this.scope.getSeed(SETTINGS_TOKEN) as SettingsSeed;

      this.count += value + settings.offset;

      return this.count;
    }

    @OnQuery(COUNT_QUERY)
    public getCount(): string {
      const settings: SettingsSeed = this.scope.getSeed(SETTINGS_TOKEN) as SettingsSeed;

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
      bindings: [ParentCounterService, { token: PARENT_TOKEN, value: "root-value" }],
      seeds: [[SETTINGS_TOKEN, { label: "root-label", offset: 1 }]],
    });
    const child: Container = new Container({
      activate: [ChildCounterService],
      bindings: [ChildCounterService],
      parent: parent,
      seeds: [[SETTINGS_TOKEN, { label: "child-label", offset: 10 }]],
    });

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

  it("uses the root seed separately from targeted seeds", () => {
    const container: Container = new Container({
      seed: { appName: "wirestate" },
      seeds: [[SETTINGS_TOKEN, { label: "targeted", offset: 7 }]],
    });

    const scope: WireScope = container.get(WireScope);

    expect(scope.getSeed()).toEqual({ appName: "wirestate" });
    expect(scope.getSeed(SETTINGS_TOKEN)).toEqual({ label: "targeted", offset: 7 });
    expect(scope.getSeed("MISSING_SEED")).toBeNull();
  });

  it("keeps scoped essentials available while services deactivate", async () => {
    const DEACTIVATE_COMMAND: string = "DEACTIVATE_COMMAND";
    const DEACTIVATE_EVENT: string = "DEACTIVATE_EVENT";
    const DEACTIVATE_QUERY: string = "DEACTIVATE_QUERY";

    const logs: Array<string> = [];

    let commandResult: Optional<Promise<string>> = null as Optional<Promise<string>>;

    @Injectable()
    class CleanupService {
      public constructor(private readonly scope: WireScope = inject(WireScope)) {}

      @OnDeactivation()
      public onDeactivation(): void {
        const settings: SettingsSeed = this.scope.getSeed(SETTINGS_TOKEN) as SettingsSeed;

        logs.push(`seed:${settings.label}`);
        this.scope.emitEvent(DEACTIVATE_EVENT, "cleanup");
        logs.push(`query-result:${this.scope.query(DEACTIVATE_QUERY)}`);

        commandResult = this.scope.executeAsync<string>(DEACTIVATE_COMMAND);
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
      bindings: [CleanupService],
      seeds: [[SETTINGS_TOKEN, { label: "cleanup-label", offset: 0 }]],
    });

    container.unbindAll();

    expect(logs).toEqual(["seed:cleanup-label", "event:cleanup", "query", "query-result:query-result", "command"]);
    expect(commandResult).not.toBeNull();

    const result: Optional<string> = await commandResult;

    expect(result).toBe("command-result");
    expect(logs).toEqual(["seed:cleanup-label", "event:cleanup", "query", "query-result:query-result", "command"]);
    expect(container.has(CleanupService)).toBe(false);
    expect(container.has(EventBus)).toBe(false);
    expect(container.has(QueryBus)).toBe(false);
    expect(container.has(CommandBus)).toBe(false);
  });

  it("keeps services able to communicate with each other while deactivating", async () => {
    const PEER_DEACTIVATE_COMMAND: string = "PEER_DEACTIVATE_COMMAND";
    const PEER_DEACTIVATE_EVENT: string = "PEER_DEACTIVATE_EVENT";
    const PEER_DEACTIVATE_QUERY: string = "PEER_DEACTIVATE_QUERY";

    const logs: Array<string> = [];
    let commandResult: Optional<Promise<string>> = null as Optional<Promise<string>>;

    const fromDeactivationPeerService: Array<unknown> = [];
    const fromDeactivationCoordinatorService: Array<unknown> = [];

    @Injectable()
    class DeactivationPeerService {
      public constructor(private readonly scope: WireScope = inject(WireScope)) {}

      @OnDeactivation()
      public onDeactivation(): void {
        logs.push("peer-deactivation");

        fromDeactivationPeerService.push(
          this.scope.get(WireScope),
          this.scope.get(DeactivationCoordinatorService),
          this.scope.get(DeactivationPeerService)
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
      public constructor(private readonly scope: WireScope = inject(WireScope)) {}

      @OnDeactivation()
      public onDeactivation(): void {
        logs.push("coordinator-deactivation");
        this.scope.emitEvent(PEER_DEACTIVATE_EVENT, "from-coordinator");
        logs.push(`coordinator-query:${this.scope.query(PEER_DEACTIVATE_QUERY, "from-coordinator")}`);

        commandResult = this.scope.executeAsync<string, string>(PEER_DEACTIVATE_COMMAND, "from-coordinator");

        fromDeactivationCoordinatorService.push(
          this.scope.get(WireScope),
          this.scope.get(DeactivationCoordinatorService),
          this.scope.get(DeactivationPeerService)
        );
      }
    }

    const container: Container = new Container({
      activate: [DeactivationCoordinatorService, DeactivationPeerService],
      bindings: [DeactivationCoordinatorService, DeactivationPeerService],
    });

    container.unbindAll();

    expect(logs).toEqual([
      "coordinator-deactivation",
      "peer-event:from-coordinator",
      "peer-query:from-coordinator",
      "coordinator-query:peer-query-result",
      "peer-command:from-coordinator",
      "peer-deactivation",
    ]);
    expect(commandResult).not.toBeNull();

    expect(await commandResult).toBe("peer-command-result");
    expect(logs).toEqual([
      "coordinator-deactivation",
      "peer-event:from-coordinator",
      "peer-query:from-coordinator",
      "coordinator-query:peer-query-result",
      "peer-command:from-coordinator",
      "peer-deactivation",
    ]);

    expect(fromDeactivationCoordinatorService).toHaveLength(3);
    expect(fromDeactivationPeerService).toHaveLength(3);
  });
});
