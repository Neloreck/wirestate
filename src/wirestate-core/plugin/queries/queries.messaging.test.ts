import {
  Container,
  inject,
  Injectable,
  OnActivated,
  OnDeactivation,
  OnDeprovision,
  OnQuery,
  QueriesPlugin,
  QueryBus,
} from "@wirestate/core";

describe("core query messaging integration", () => {
  it("keeps parent and child query buses separate", () => {
    const COUNT_QUERY: string = "COUNT_QUERY";
    const PARENT_TOKEN: string = "PARENT_TOKEN";
    const SETTINGS_TOKEN: string = "SETTINGS_TOKEN";

    interface SettingsData {
      readonly label: string;
    }

    @Injectable()
    class ParentCounterService {
      private count: number = 3;

      public constructor(private readonly container: Container = inject(Container)) {}

      @OnQuery(COUNT_QUERY)
      public getCount(): string {
        const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

        return `${settings.label}:${this.count}`;
      }
    }

    @Injectable()
    class ChildCounterService {
      private count: number = 112;

      public constructor(private readonly container: Container = inject(Container)) {}

      @OnQuery(COUNT_QUERY)
      public getCount(): string {
        const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

        return `${settings.label}:${this.count}`;
      }
    }

    const parent: Container = new Container({
      activate: [ParentCounterService],
      bindings: [
        ParentCounterService,
        { token: PARENT_TOKEN, value: "root-value" },
        { token: SETTINGS_TOKEN, value: { label: "root-label" } },
      ],
      plugins: [new QueriesPlugin()],
    }).provision();

    const child: Container = new Container({
      activate: [ChildCounterService],
      bindings: [ChildCounterService, { token: SETTINGS_TOKEN, value: { label: "child-label" } }],
      parent: parent,
      plugins: [new QueriesPlugin()],
    }).provision();

    expect(child.get(PARENT_TOKEN)).toBe("root-value");
    expect(child.get(QueryBus)).not.toBe(parent.get(QueryBus));

    expect(parent.get(QueryBus).query(COUNT_QUERY)).toBe("root-label:3");
    expect(child.get(QueryBus).query(COUNT_QUERY)).toBe("child-label:112");

    child.unbindAll();

    expect(parent.get(QueryBus).query(COUNT_QUERY)).toBe("root-label:3");
  });

  it("restores the shadowed query handler after the shadowing instance is removed", () => {
    const CURRENT_QUERY: string = "CURRENT_QUERY";
    const lifecycle: Array<string> = [];

    @Injectable()
    class PrimaryHandlerService {
      private value: string = "primary";

      @OnActivated()
      public onActivated(): void {
        lifecycle.push("primary:activated");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        lifecycle.push("primary:deactivated");
      }

      @OnQuery(CURRENT_QUERY)
      public getCurrent(): string {
        return this.value;
      }
    }

    @Injectable()
    class SecondaryHandlerService {
      private value: string = "secondary";

      @OnActivated()
      public onActivated(): void {
        lifecycle.push("secondary:activated");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        lifecycle.push("secondary:deactivated");
      }

      @OnQuery(CURRENT_QUERY)
      public getCurrent(): string {
        return this.value;
      }
    }

    const container: Container = new Container({
      activate: [PrimaryHandlerService, SecondaryHandlerService],
      bindings: [PrimaryHandlerService, SecondaryHandlerService],
      plugins: [new QueriesPlugin()],
    }).provision();

    expect(container.get(QueryBus).hasHandler(CURRENT_QUERY)).toBe(true);
    expect(lifecycle).toEqual(["primary:activated", "secondary:activated"]);
    expect(container.get(QueryBus).query(CURRENT_QUERY)).toBe("secondary");

    container.unbind(SecondaryHandlerService);

    expect(lifecycle).toEqual(["primary:activated", "secondary:activated", "secondary:deactivated"]);
    expect(container.get(QueryBus).query(CURRENT_QUERY)).toBe("primary");

    container.unbind(PrimaryHandlerService);

    expect(container.get(QueryBus).hasHandler(CURRENT_QUERY)).toBe(false);
    expect(() => container.get(QueryBus).query(CURRENT_QUERY)).toThrow(
      "No query handler registered in container for type: 'CURRENT_QUERY'."
    );
  });

  it("lets a service run queries while it deprovisions", () => {
    const DEACTIVATE_QUERY: string = "DEACTIVATE_QUERY";
    const SETTINGS_TOKEN: string = "SETTINGS_TOKEN";

    const logs: Array<string> = [];

    interface SettingsData {
      readonly label: string;
    }

    @Injectable()
    class CleanupService {
      public constructor(
        private readonly container: Container = inject(Container),
        private readonly queryBus: QueryBus = inject(QueryBus)
      ) {}

      @OnDeprovision()
      public onDeprovision(): void {
        const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

        logs.push(`settings:${settings.label}`);
        logs.push(`query-result:${this.queryBus.query(DEACTIVATE_QUERY)}`);
      }

      @OnQuery(DEACTIVATE_QUERY)
      public onQuery(): string {
        logs.push("query");

        return "query-result";
      }
    }

    const container: Container = new Container({
      activate: [CleanupService],
      bindings: [CleanupService, { token: SETTINGS_TOKEN, value: { label: "cleanup-label" } }],
      plugins: [new QueriesPlugin()],
    })
      .provision()
      .unbindAll();

    expect(logs).toEqual(["settings:cleanup-label", "query", "query-result:query-result"]);
    expect(container.has(CleanupService)).toBe(false);
    expect(container.has(QueryBus)).toBe(false);
  });

  it("lets services query each other while deprovisioning", () => {
    const PEER_DEACTIVATE_QUERY: string = "PEER_DEACTIVATE_QUERY";

    const logs: Array<string> = [];

    @Injectable()
    class DeactivationPeerService {
      @OnDeprovision()
      public onDeprovision(): void {
        logs.push("peer-deprovision");
      }

      @OnQuery(PEER_DEACTIVATE_QUERY)
      public onQuery(value: string): string {
        logs.push(`peer-query:${value}`);

        return "peer-query-result";
      }
    }

    @Injectable()
    class DeactivationCoordinatorService {
      public constructor(private readonly queryBus: QueryBus = inject(QueryBus)) {}

      @OnDeprovision()
      public onDeprovision(): void {
        logs.push("coordinator-deprovision");
        logs.push(`coordinator-query:${this.queryBus.query(PEER_DEACTIVATE_QUERY, "from-coordinator")}`);
      }
    }

    new Container({
      activate: [DeactivationCoordinatorService, DeactivationPeerService],
      bindings: [DeactivationPeerService, DeactivationCoordinatorService],
      plugins: [new QueriesPlugin()],
    })
      .provision()
      .unbindAll();

    expect(logs).toEqual([
      "coordinator-deprovision",
      "peer-query:from-coordinator",
      "coordinator-query:peer-query-result",
      "peer-deprovision",
    ]);
  });
});
