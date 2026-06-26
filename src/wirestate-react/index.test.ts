import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate-react", () => {
  it("should export exactly the documented react API surface", () => {
    assertExportedApi(require.resolve("./index"), {
      values: [
        "ContainerContext",
        "ContainerProvider",
        "useCommandExecutor",
        "useCommandExecutorAsync",
        "useCommandExecutorOptional",
        "useCommandExecutorOptionalAsync",
        "useContainer",
        "useEventEmitter",
        "useInjection",
        "useOnCommand",
        "useOnEvents",
        "useOnQuery",
        "useOptionalInjection",
        "useQueryExecutor",
        "useQueryExecutorAsync",
        "useQueryExecutorOptional",
        "useQueryExecutorOptionalAsync",
      ],
      types: [
        "CommandExecutor",
        "CommandExecutorAsync",
        "CommandExecutorOptional",
        "CommandExecutorOptionalAsync",
        "ContainerProviderProps",
        "EventEmitter",
        "OptionalInjectionFallback",
        "QueryExecutor",
        "QueryExecutorAsync",
        "QueryExecutorOptional",
        "QueryExecutorOptionalAsync",
      ],
    });
  });
});
