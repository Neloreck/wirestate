describe("Library exported API from wirestate/mobx", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    "$mobx",
    "Action",
    "AnnotationMapEntry",
    "AnnotationsMap",
    "BoundAction",
    "Computed",
    "CreateObservableOptions",
    "DeepObservable",
    "FlowCancellationError",
    "IActionFactory",
    "IActionRunInfo",
    "IArrayDidChange",
    "IArraySplice",
    "IArrayUpdate",
    "IArrayWillChange",
    "IArrayWillSplice",
    "IAtom",
    "IAutorunOptions",
    "IComputedFactory",
    "IComputedValue",
    "IComputedValueOptions",
    "IDepTreeNode",
    "IDependencyTree",
    "IEnhancer",
    "IEqualsComparer",
    "IInterceptable",
    "IInterceptor",
    "IKeyValueMap",
    "IListenable",
    "IMapDidChange",
    "IMapEntries",
    "IMapEntry",
    "IMapWillChange",
    "IObjectDidChange",
    "IObjectWillChange",
    "IObservable",
    "IObservableArray",
    "IObservableFactory",
    "IObservableMapInitialValues",
    "IObservableSetInitialValues",
    "IObservableValue",
    "IObserverTree",
    "IReactionDisposer",
    "IReactionOptions",
    "IReactionPublic",
    "ISetDidChange",
    "ISetWillChange",
    "IValueDidChange",
    "IValueWillChange",
    "IWhenOptions",
    "Lambda",
    "Observable",
    "ObservableMap",
    "ObservableSet",
    "Reaction",
    "RefObservable",
    "ShallowObservable",
    "autorun",
    "comparer",
    "configure",
    "createAtom",
    "defineProperty",
    "entries",
    "extendObservable",
    "flow",
    "flowResult",
    "get",
    "getAtom",
    "getDebugName",
    "getDependencyTree",
    "getObserverTree",
    "has",
    "intercept",
    "isAction",
    "isBoxedObservable",
    "isComputed",
    "isComputedProp",
    "isFlow",
    "isFlowCancellationError",
    "isObservable",
    "isObservableArray",
    "isObservableMap",
    "isObservableObject",
    "isObservableProp",
    "isObservableSet",
    "keys",
    "makeAutoObservable",
    "makeObservable",
    "observe",
    "onBecomeObserved",
    "onBecomeUnobserved",
    "onReactionError",
    "override",
    "ownKeys",
    "reaction",
    "remove",
    "runInAction",
    "set",
    "spy",
    "toJS",
    "trace",
    "transaction",
    "untracked",
    "values",
    "when",
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

  it("should export correct core API methods", () => {
    assertListIntersection(Object.keys(libRoot), expectedLibExports);
    expect(Object.keys(libRoot)).toHaveLength(expectedLibExports.length);
  });

  it("should expose decorator-alias factories returning the underlying MobX primitives", () => {
    const mobx = require("mobx");

    expect(libRoot.Action()).toBe(mobx.action);
    expect(libRoot.BoundAction()).toBe(mobx.action.bound);
    expect(libRoot.Computed()).toBe(mobx.computed);
    expect(libRoot.Observable()).toBe(mobx.observable);
    expect(libRoot.ShallowObservable()).toBe(mobx.observable.shallow);
    expect(libRoot.RefObservable()).toBe(mobx.observable.ref);
    expect(libRoot.DeepObservable()).toBe(mobx.observable.deep);
  });
});
