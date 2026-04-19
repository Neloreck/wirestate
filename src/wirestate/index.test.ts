
describe("Library exported API", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    // Aliases.
    "Container",
    "Inject",
    "Injectable",
    "autorun",
    "flow",
    "flowResult",
    "isFlow",
    "isFlowCancellationError",
    "makeAutoObservable",
    "makeObservable",
    "runInAction",
    "observer",
    "Observable",
    "ShallowObservable",
    "RefObservable",
    "DeepObservable",
    "Action",
    "Computed",
    "forwardRef",
    // Core.
    "bindService",
    "createIocContainer",
    "emitSignal",
    "query",
    "applyInitialState",
    "InitialState",
    "createServicesProvider",
    "ServicesProviderProps",
    "ServicesProvider",
    "IocProvider",
    "useContainer",
    "useContainerRevision",
    "OnQuery",
    "useQueryCaller",
    "useQueryHandler",
    "useSyncQueryCaller",
    "INITIAL_STATE",
    "AbstractService",
    "useService",
    "OnSignal",
    "useSignal",
    "useSignalEmitter",
    "InitialStateEntries",
    "InitialStateEntry",
    "InitialStateKey",
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
