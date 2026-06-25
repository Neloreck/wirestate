import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate-core/devtools", () => {
  it("should export exactly the documented devtools API surface", () => {
    assertExportedApi(require.resolve("./devtools"), {
      values: ["DevToolsPlugin"],
      types: ["DevToolsPluginConfig"],
    });
  });
});
