import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate/react-mobx", () => {
  it("should export exactly the documented react-mobx API surface", () => {
    assertExportedApi(require.resolve("./index"), {
      values: [
        "Observer",
        "clearTimers",
        "enableStaticRendering",
        "isObserverBatched",
        "isUsingStaticRendering",
        "observer",
        "observerBatching",
        "useAsObservableSource",
        "useLocalObservable",
        "useLocalStore",
        "useObserver",
      ],
      types: [],
    });
  });
});
