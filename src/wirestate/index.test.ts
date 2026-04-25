import { CommandCaller, CommandHandler, CommandStatus, CommandType } from "@/wirestate/index";

describe("Library exported API from wirestate", () => {
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
    "CommandCaller",
    "CommandDescriptor",
    "CommandHandler",
    "CommandStatus",
    "CommandType",
    "CommandUnregister",
    "InjectableDescriptor",
    "InjectablesProvider",
    "InjectablesProviderProps",
    "IocProvider",
    "OnActivated",
    "OnCommand",
    "OnDeactivation",
    "OnQuery",
    "OnEvent",
    "QueryHandler",
    "QueryResponder",
    "QueryType",
    "QueryUnregister",
    "SEED",
    "SeedEntries",
    "SeedEntry",
    "SeedKey",
    "Event",
    "EventEmitter",
    "EventHandler",
    "EventType",
    "EventUnsubscriber",
    "WireScope",
    "WirestateError",
    "bindConstant",
    "bindEntry",
    "bindService",
    "command",
    "commandOptional",
    "createInjectablesProvider",
    "createIocContainer",
    "emitEvent",
    "query",
    "queryOptional",
    "useCommandCaller",
    "useCommandHandler",
    "useContainer",
    "useContainerRevision",
    "useInjection",
    "useOptionalCommandCaller",
    "useOptionalInjection",
    "useOptionalQueryCaller",
    "useOptionalSyncQueryCaller",
    "useQueryCaller",
    "useQueryHandler",
    "useEvent",
    "useEventEmitter",
    "useEventsHandler",
    "useEvents",
    "useSyncQueryCaller",
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
