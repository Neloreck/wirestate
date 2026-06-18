import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate-react", () => {
  it("should export exactly the documented react API surface", () => {
    assertExportedApi(require.resolve("./index"), {
      values: [
        "ContainerContext",
        "ContainerProvider",
        "useAllEvents",
        "useAsyncCommandExecutor",
        "useAsyncQueryExecutor",
        "useCommandExecutor",
        "useCommandHandler",
        "useContainer",
        "useEvent",
        "useEventEmitter",
        "useEvents",
        "useInjection",
        "useOptionalAsyncCommandExecutor",
        "useOptionalAsyncQueryExecutor",
        "useOptionalCommandExecutor",
        "useOptionalInjection",
        "useOptionalQueryExecutor",
        "useQueryExecutor",
        "useQueryHandler",
      ],
      types: [
        "AsyncCommandExecutor",
        "AsyncQueryExecutor",
        "CommandExecutor",
        "ContainerProviderProps",
        "EventEmitter",
        "OptionalAsyncCommandExecutor",
        "OptionalAsyncQueryExecutor",
        "OptionalCommandExecutor",
        "OptionalInjectionFallback",
        "OptionalQueryExecutor",
        "QueryExecutor",
      ],
    });
  });
});
