import {
  CommandBus,
  Container,
  EventBus,
  Inject,
  Injectable,
  OnCommand,
  OnEvent,
  OnQuery,
  QueryBus,
  WireScope,
  command,
  createContainer,
  emitEvent,
  query,
} from "../index";

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

    public constructor(
      @Inject(WireScope)
      private readonly scope: WireScope
    ) {}

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

    public constructor(
      @Inject(WireScope)
      private readonly scope: WireScope
    ) {}

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
    const parent: Container = createContainer({
      entries: [ParentCounterService, { id: PARENT_TOKEN, value: "root-value" }],
      seeds: [[SETTINGS_TOKEN, { label: "root-label", offset: 1 }]],
      activate: [ParentCounterService],
    });
    const child: Container = createContainer({
      parent,
      entries: [ChildCounterService],
      seeds: [[SETTINGS_TOKEN, { label: "child-label", offset: 10 }]],
      activate: [ChildCounterService],
    });

    expect(child.get(PARENT_TOKEN)).toBe("root-value");
    expect(child.get(EventBus)).not.toBe(parent.get(EventBus));
    expect(child.get(CommandBus)).not.toBe(parent.get(CommandBus));
    expect(child.get(QueryBus)).not.toBe(parent.get(QueryBus));

    expect(await command(parent, ADD_COMMAND, 2).task).toBe(3);
    expect(await command(child, ADD_COMMAND, 2).task).toBe(112);
    expect(query(parent, COUNT_QUERY)).toBe("root-label:3");
    expect(query(child, COUNT_QUERY)).toBe("child-label:112");

    emitEvent(parent, LOG_EVENT, "from-parent");
    emitEvent(child, LOG_EVENT, "from-child");

    expect(parent.get(ParentCounterService).events).toEqual(["parent:from-parent"]);
    expect(child.get(ChildCounterService).events).toEqual(["child:from-child"]);

    child.unbindAll();

    expect(await command(parent, ADD_COMMAND, 2).task).toBe(6);
    expect(query(parent, COUNT_QUERY)).toBe("root-label:6");

    emitEvent(parent, LOG_EVENT, "from-parent");
    expect(parent.get(ParentCounterService).events).toEqual(["parent:from-parent", "parent:from-parent"]);
  });

  it("uses the root seed separately from targeted seeds", () => {
    const container: Container = createContainer({
      seed: { appName: "wirestate" },
      seeds: [[SETTINGS_TOKEN, { label: "targeted", offset: 7 }]],
    });

    const scope: WireScope = container.get(WireScope);

    expect(scope.getSeed()).toEqual({ appName: "wirestate" });
    expect(scope.getSeed(SETTINGS_TOKEN)).toEqual({ label: "targeted", offset: 7 });
    expect(scope.getSeed("MISSING_SEED")).toBeNull();
  });
});
