describe("Library exported API from wirestate-react", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    "AsyncQueryExecutor",
    "CommandExecutor",
    "ContainerProvider",
    "ContainerProviderProps",
    "EventEmitter",
    "OptionalAsyncQueryExecutor",
    "OptionalCommandExecutor",
    "OptionalQueryExecutor",
    "QueryExecutor",
    "QueryResponder",
    "SubContainerProvider",
    "SubContainerProviderProps",
    "useAsyncQueryExecutor",
    "useCommandExecutor",
    "useCommandHandler",
    "useContainer",
    "useEvent",
    "useEventEmitter",
    "useEvents",
    "useEventsHandler",
    "useInjection",
    "useOptionalAsyncQueryExecutor",
    "useOptionalCommandExecutor",
    "useOptionalInjection",
    "useOptionalQueryExecutor",
    "useQueryExecutor",
    "useQueryHandler",
    "useScope",
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
