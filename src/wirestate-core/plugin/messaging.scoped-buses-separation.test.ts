import {
  CommandBus,
  CommandsPlugin,
  Container,
  EventBus,
  EventsPlugin,
  inject,
  Injectable,
  OnCommand,
  OnEvent,
  OnQuery,
  QueriesPlugin,
  QueryBus,
} from "@wirestate/core";

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
        ParentCounterService,
        { token: PARENT_TOKEN, value: "root-value" },
        { token: SETTINGS_TOKEN, value: { label: "root-label", offset: 1 } },
      ],
      plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin()],
    }).provision();

    const child: Container = new Container({
      activate: [ChildCounterService],
      bindings: [ChildCounterService, { token: SETTINGS_TOKEN, value: { label: "child-label", offset: 10 } }],
      parent: parent,
      plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin()],
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
});
