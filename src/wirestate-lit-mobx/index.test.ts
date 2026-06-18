import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate/lit-mobx", () => {
  it("should export exactly the documented lit-mobx API surface", () => {
    assertExportedApi(require.resolve("./index"), {
      values: ["MobxLitElement", "MobxReactionUpdate"],
      types: ["ReactiveElementConstructor"],
    });
  });
});
