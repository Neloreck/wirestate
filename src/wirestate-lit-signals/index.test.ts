import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate/lit-signals", () => {
  it("should export exactly the documented lit-signals API surface", () => {
    assertExportedApi(require.resolve("./index"), {
      values: ["SignalWatcher", "html", "svg", "watch", "withWatch"],
      types: [],
    });
  });
});
