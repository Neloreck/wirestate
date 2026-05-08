describe("Library exported API from wirestate-core", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    // Aliases.
    "BindingType",
    "Container",
    "ContainerModule",
    "Inject",
    "Injectable",
    "LazyServiceIdentifier",
    "MultiInject",
    "Named",
    "Optional",
    "PostConstruct",
    "PreDestroy",
    "ScopeBindingType",
    "Tagged",
    "forwardRef",
    // Core.
    "CommandBus",
    "CommandCaller",
    "CommandDescriptor",
    "CommandHandler",
    "CommandStatus",
    "CommandType",
    "CommandUnregister",
    "Event",
    "EventBus",
    "EventEmitter",
    "EventHandler",
    "EventType",
    "EventUnsubscriber",
    "InjectableDescriptor",
    "OnActivated",
    "OnCommand",
    "OnDeactivation",
    "OnEvent",
    "OnQuery",
    "OptionalCommandCaller",
    "OptionalQueryCaller",
    "OptionalSyncQueryCaller",
    "QueryBus",
    "QueryCaller",
    "QueryHandler",
    "QueryResponder",
    "QueryType",
    "QueryUnregister",
    "SEED",
    "SEEDS",
    "SeedEntries",
    "SeedEntry",
    "SeedKey",
    "SyncQueryCaller",
    "WireScope",
    "WirestateError",
    "applySeeds",
    "applySharedSeed",
    "bindConstant",
    "bindEntry",
    "bindService",
    "command",
    "commandOptional",
    "createIocContainer",
    "emitEvent",
    "getEntryToken",
    "query",
    "queryOptional",
    "unapplySeeds",
  ];

  const assertListIntersection = (first: Array<string>, second: Array<string>) => {
    first.forEach((it: string) => {
      if (!second.includes(it)) {
        throw new Error("Item missing in expected list: " + it);
      }
    });
    second.forEach((it: string) => {
      if (!first.includes(it)) {
        throw new Error("Item missing in library root: " + it);
      }
    });
  };

  it("should export correct core API methods", () => {
    assertListIntersection(Object.keys(libRoot), expectedLibExports);
    expect(Object.keys(libRoot)).toHaveLength(expectedLibExports.length);
  });
});
