import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate/signals", () => {
  it("should export exactly the documented signals API surface", () => {
    assertExportedApi(require.resolve("./index"), {
      values: ["Signal", "action", "batch", "computed", "createModel", "effect", "signal", "untracked"],
      types: ["Model", "ModelConstructor", "ReadonlySignal"],
    });
  });
});
