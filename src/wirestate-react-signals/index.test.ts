import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate/react-signals", () => {
  it("should export exactly the documented react-signals API surface", () => {
    assertExportedApi(require.resolve("./index"), {
      values: [
        "ensureFinalCleanup",
        "useComputed",
        "useModel",
        "useSignal",
        "useSignalEffect",
        "useSignals",
        "wrapJsx",
      ],
      types: ["EffectStore"],
    });
  });
});
