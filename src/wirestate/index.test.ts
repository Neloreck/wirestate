describe("Library exported API", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    // Aliases.
    "Action",
    "Computed",
    "Container",
    "BindingType",
    "ScopeBindingType",
    "DeepObservable",
    "Inject",
    "Injectable",
    "Observable",
    "RefObservable",
    "ShallowObservable",
    "autorun",
    "flow",
    "flowResult",
    "forwardRef",
    "isFlow",
    "isFlowCancellationError",
    "makeAutoObservable",
    "makeObservable",
    "observer",
    "runInAction",
    // Core.
    "bindConstant",
    "bindEntry",
    "bindService",
    "createIocContainer",
    "emitSignal",
    "query",
    "applyInitialState",
    "InitialState",
    "createServicesProvider",
    "ServicesProviderProps",
    "ServicesProvider",
    "IocProvider",
    "useContainer",
    "useContainerRevision",
    "OnQuery",
    "useQueryCaller",
    "useQueryHandler",
    "useSyncQueryCaller",
    "INITIAL_STATE",
    "AbstractService",
    "useInjection",
    "OnSignal",
    "useSignal",
    "useSignalEmitter",
    "InitialStateEntries",
    "InitialStateEntry",
    "InitialStateKey",
    "InjectableDescriptor",
    "QueryHandler",
    "QueryResponder",
    "QueryType",
    "QueryUnregister",
    "ServiceClass",
    "Signal",
    "SignalEmitter",
    "SignalHandler",
    "SignalType",
    "SignalUnsubscribe",
  ];

  const assertListIntersection = (first: Array<string>, second: Array<string>) => {
    first.forEach((it: string) => {
      if (!second.includes(it)) {
        throw new Error("Item missing in expected list: " + it);
      }
    });
    second.forEach((it: string) => {
      if (!first.includes(it)) {
        throw new Error("Item missing in library root: " + it);
      }
    });
  };

  const assertInList = (item: string, list: Array<string>, message?: string) => {
    if (!list.includes(item)) {
      throw new Error(message ?? "Item missing in library root: " + item);
    }
  };

  it("should export correct core API methods", () => {
    assertListIntersection(Object.keys(libRoot), expectedLibExports);
    expect(Object.keys(libRoot)).toHaveLength(expectedLibExports.length);
  });

  describe("Environment switchers", () => {
    const fs = require("fs");
    const path = require("path");

    it("esm.js should export the same API as index.ts", () => {
      const esmContent: string = fs.readFileSync(path.resolve(__dirname, "../environment_switch/esm.js"), "utf8");
      const exportedNames: Array<string> = [...esmContent.matchAll(/export const (\w+) =/g)].map((m) => m[1]);

      // Filter expectedLibExports to only include runtime values (not types/interfaces).
      // Based on index.ts, some exports are types.
      const expectedRuntimeExports = [
        "Action",
        "Computed",
        "Container",
        "DeepObservable",
        "INITIAL_STATE",
        "InitialState",
        "Inject",
        "Injectable",
        "IocProvider",
        "Observable",
        "OnQuery",
        "OnSignal",
        "RefObservable",
        "ShallowObservable",
        "AbstractService",
        "applyInitialState",
        "autorun",
        "bindService",
        "createIocContainer",
        "createServicesProvider",
        "emitSignal",
        "flow",
        "flowResult",
        "forwardRef",
        "isFlow",
        "isFlowCancellationError",
        "makeAutoObservable",
        "makeObservable",
        "observer",
        "query",
        "runInAction",
        "useContainer",
        "useContainerRevision",
        "useQueryCaller",
        "useQueryHandler",
        "useService",
        "useSignal",
        "useSignalEmitter",
        "useSyncQueryCaller",
      ];

      const rootExports: Array<string> = Object.keys(libRoot);

      assertListIntersection(exportedNames, expectedRuntimeExports);
      exportedNames.forEach((it) => assertInList(it, rootExports));

      expect(exportedNames).toHaveLength(expectedRuntimeExports.length);
    });

    it("cjs_core.js should point to existing files in target/pkg (if built)", () => {
      const cjsCorePath = path.resolve(__dirname, "../environment_switch/cjs_core.js");
      const cjsCoreContent = fs.readFileSync(cjsCorePath, "utf8");

      expect(cjsCoreContent).toContain(`require("./cjs/production/index.js")`);
      expect(cjsCoreContent).toContain(`require("./cjs/development/index.js")`);
    });

    it("cjs_utils.js should point to existing files in target/pkg (if built)", () => {
      const cjsUtilsPath = path.resolve(__dirname, "../environment_switch/cjs_utils.js");
      const cjsUtilsContent = fs.readFileSync(cjsUtilsPath, "utf8");

      expect(cjsUtilsContent).toContain(`require("./cjs/production/test-utils.js")`);
      expect(cjsUtilsContent).toContain(`require("./cjs/development/test-utils.js")`);
    });
  });
});
