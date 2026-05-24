describe("Library exported API from wirestate-react", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    "CommandCaller",
    "ContainerProvider",
    "ContainerProviderProps",
    "AsyncQueryCaller",
    "EventEmitter",
    "OnDeprovision",
    "OnProvision",
    "OptionalCommandCaller",
    "OptionalAsyncQueryCaller",
    "OptionalQueryCaller",
    "QueryCaller",
    "QueryResponder",
    "SubContainerProvider",
    "SubContainerProviderProps",
    "useCommandCaller",
    "useCommandHandler",
    "useAsyncQueryCaller",
    "useContainer",
    "useEvent",
    "useEventEmitter",
    "useEvents",
    "useEventsHandler",
    "useInjection",
    "useOptionalCommandCaller",
    "useOptionalAsyncQueryCaller",
    "useOptionalInjection",
    "useOptionalQueryCaller",
    "useQueryCaller",
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
