import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate-react", () => {
  it("should export exactly the documented react API surface", () => {
    assertExportedApi(require.resolve("./index"), {
      values: [
        "ContainerContext",
        "ContainerProvider",
        "useContainer",
        "useInjection",
        "useOnCommand",
        "useOnEvents",
        "useOnQuery",
      ],
      types: ["ContainerProviderProps", "InjectionFallback"],
    });
  });
});
