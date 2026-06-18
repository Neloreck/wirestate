import { assertAggregatedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate", () => {
  it("should re-export the full core and React surfaces from the root", () => {
    assertAggregatedApi(require.resolve("./index"), [
      require.resolve("../wirestate-core"),
      require.resolve("../wirestate-react"),
    ]);
  });

  it("should re-export the full MobX adapter surfaces from wirestate/mobx", () => {
    assertAggregatedApi(require.resolve("./mobx"), [
      require.resolve("../wirestate-mobx"),
      require.resolve("../wirestate-react-mobx"),
    ]);
  });

  it("should re-export the full signals adapter surfaces from wirestate/signals", () => {
    assertAggregatedApi(require.resolve("./signals"), [
      require.resolve("../wirestate-signals"),
      require.resolve("../wirestate-react-signals"),
    ]);
  });
});
