describe("Library exported API", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    // Aliases.
    "Action",
    "Computed",
    "Container",
    "ContainerModule",
    "BindingType",
    "ScopeBindingType",
    "DeepObservable",
    "Inject",
    "Injectable",
    "MultiInject",
    "Named",
    "Observable",
    "Optional",
    "PostConstruct",
    "PreDestroy",
    "RefObservable",
    "ShallowObservable",
    "Tagged",
    "autorun",
    "comparer",
    "configure",
    "flow",
    "flowResult",
    "forwardRef",
    "isAction",
    "isFlow",
    "isFlowCancellationError",
    "isObservable",
    "makeAutoObservable",
    "makeObservable",
    "observer",
    "reaction",
    "runInAction",
    "toJS",
    "when",
    // Core.
    "bindConstant",
    "bindEntry",
    "bindService",
    "createIocContainer",
    "emitSignal",
    "query",
    "queryOptional",
    "createInjectablesProvider",
    "InjectablesProvider",
    "InjectablesProviderProps",
    "IocProvider",
    "useContainer",
    "useContainerRevision",
    "OnQuery",
    "useQueryCaller",
    "useOptionalQueryCaller",
    "useQueryHandler",
    "useSyncQueryCaller",
    "useOptionalSyncQueryCaller",
    "INITIAL_STATE",
    "AbstractService",
    "useInjection",
    "useOptionalInjection",
    "OnSignal",
    "useSignal",
    "useSignals",
    "useSignalHandler",
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
      const expectedRuntimeExports = [
        "Action",
        "Computed",
        "Container",
        "ContainerModule",
        "DeepObservable",
        "INITIAL_STATE",
        "Inject",
        "Injectable",
        "IocProvider",
        "MultiInject",
        "Named",
        "Observable",
        "OnQuery",
        "OnSignal",
        "Optional",
        "PostConstruct",
        "PreDestroy",
        "RefObservable",
        "ShallowObservable",
        "Tagged",
        "AbstractService",
        "autorun",
        "bindConstant",
        "bindEntry",
        "bindService",
        "comparer",
        "configure",
        "createIocContainer",
        "createInjectablesProvider",
        "emitSignal",
        "flow",
        "flowResult",
        "forwardRef",
        "isAction",
        "isFlow",
        "isFlowCancellationError",
        "isObservable",
        "makeAutoObservable",
        "makeObservable",
        "observer",
        "query",
        "queryOptional",
        "reaction",
        "runInAction",
        "toJS",
        "useContainer",
        "useContainerRevision",
        "useInjection",
        "useOptionalInjection",
        "useOptionalQueryCaller",
        "useOptionalSyncQueryCaller",
        "useQueryCaller",
        "useQueryHandler",
        "useSignal",
        "useSignals",
        "useSignalEmitter",
        "useSignalHandler",
        "useSyncQueryCaller",
        "when",
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
