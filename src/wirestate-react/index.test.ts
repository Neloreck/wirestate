import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate-react", () => {
  it("should export exactly the documented react API surface", () => {
    assertExportedApi(require.resolve("./index"), {
      values: [
        "ContainerContext",
        "ContainerProvider",
        "useCommandExecutor",
        "useCommandExecutorAsync",
        "useContainer",
        "useEventEmitter",
        "useInjection",
        "useOnCommand",
        "useOnEvents",
        "useOnQuery",
        "useQueryExecutor",
        "useQueryExecutorAsync",
      ],
      types: [
        "CommandExecutor",
        "CommandExecutorAsync",
        "ContainerProviderProps",
        "EventEmitter",
        "InjectionFallback",
        "QueryExecutor",
        "QueryExecutorAsync",
      ],
    });
  });
});
