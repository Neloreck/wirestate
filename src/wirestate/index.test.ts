describe("Library exported API from wirestate", () => {
  const exportedKeys = (...modules: Array<Record<string, unknown>>): Array<string> => {
    return Array.from(new Set(modules.flatMap((mod) => Object.keys(mod)))).sort();
  };

  it("should export current core and React APIs from the root", () => {
    const libRoot = require("./index") as Record<string, unknown>;
    const coreRoot = require("../wirestate-core") as Record<string, unknown>;
    const reactRoot = require("../wirestate-react") as Record<string, unknown>;

    expect(Object.keys(libRoot).sort()).toEqual(exportedKeys(coreRoot, reactRoot));
  });

  it("should export current MobX adapter APIs from wirestate/mobx", () => {
    const mobxRoot = require("./mobx") as Record<string, unknown>;
    const wirestateMobxRoot = require("../wirestate-mobx") as Record<string, unknown>;
    const wirestateReactMobxRoot = require("../wirestate-react-mobx") as Record<string, unknown>;

    expect(Object.keys(mobxRoot).sort()).toEqual(
      [...exportedKeys(wirestateMobxRoot), ...exportedKeys(wirestateReactMobxRoot)].sort()
    );
  });

  it("should export current signals adapter APIs from wirestate/signals", () => {
    const signalsRoot = require("./signals") as Record<string, unknown>;
    const wirestateSignalsRoot = require("../wirestate-signals") as Record<string, unknown>;
    const reactSignalsRoot = require("../wirestate-react-signals") as Record<string, unknown>;

    expect(Object.keys(signalsRoot).sort()).toEqual(
      [...exportedKeys(wirestateSignalsRoot), ...exportedKeys(reactSignalsRoot)].sort()
    );
  });
});
