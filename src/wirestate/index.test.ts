import { CommandCaller, CommandHandler, CommandStatus, CommandType } from "@/wirestate/index";

describe("Library exported API", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    // Aliases.
    "Action",
    "Computed",
    "Container",
    "ContainerModule",
    "BindingType",
    "ScopeBindingType",
    "DeepObservable",
    "Inject",
    "Injectable",
    "MultiInject",
    "Named",
    "Observable",
    "Optional",
    "PostConstruct",
    "PreDestroy",
    "RefObservable",
    "ShallowObservable",
    "Tagged",
    "autorun",
    "comparer",
    "configure",
    "flow",
    "flowResult",
    "forwardRef",
    "isAction",
    "isFlow",
    "isFlowCancellationError",
    "isObservable",
    "makeAutoObservable",
    "makeObservable",
    "observer",
    "reaction",
    "runInAction",
    "toJS",
    "when",
    // Core.
    "bindConstant",
    "bindEntry",
    "bindService",
    "createIocContainer",
    "command",
    "commandOptional",
    "emitSignal",
    "query",
    "queryOptional",
    "WirestateError",
    "createInjectablesProvider",
    "InjectablesProvider",
    "InjectablesProviderProps",
    "IocProvider",
    "useContainer",
    "useContainerRevision",
    "OnCommand",
    "useCommandCaller",
    "useOptionalCommandCaller",
    "useCommandHandler",
    "OnQuery",
    "useQueryCaller",
    "useOptionalQueryCaller",
    "useQueryHandler",
    "useSyncQueryCaller",
    "useOptionalSyncQueryCaller",
    "SEED",
    "AbstractService",
    "OnActivated",
    "OnDeactivation",
    "useInjection",
    "useOptionalInjection",
    "OnSignal",
    "useSignal",
    "useSignals",
    "useSignalHandler",
    "useSignalEmitter",
    "SeedEntries",
    "SeedEntry",
    "SeedKey",
    "InjectableDescriptor",
    "CommandStatus",
    "CommandDescriptor",
    "CommandHandler",
    "CommandType",
    "CommandUnregister",
    "CommandCaller",
    "QueryHandler",
    "QueryResponder",
    "QueryType",
    "QueryUnregister",
    "ServiceClass",
    "Signal",
    "SignalEmitter",
    "SignalHandler",
    "SignalType",
    "SignalUnsubscribe",
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
