describe("Library exported API from wirestate-react", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    "CommandCaller",
    "EventEmitter",
    "InjectablesProvider",
    "InjectablesProviderProps",
    "IocActivator",
    "IocActivatorProps",
    "IocProvider",
    "OptionalCommandCaller",
    "OptionalQueryCaller",
    "OptionalSyncQueryCaller",
    "QueryCaller",
    "QueryResponder",
    "SyncQueryCaller",
    "createInjectablesProvider",
    "useCommandCaller",
    "useCommandHandler",
    "useContainer",
    "useContainerRevision",
    "useEvent",
    "useEventEmitter",
    "useEvents",
    "useEventsHandler",
    "useInjection",
    "useOptionalCommandCaller",
    "useOptionalInjection",
    "useOptionalQueryCaller",
    "useOptionalSyncQueryCaller",
    "useQueryCaller",
    "useQueryHandler",
    "useScope",
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
