describe("Library exported API from wirestate/mobx", () => {
  const libRoot = require("./mobx");

  const expectedLibExports: Array<string> = [
    "Action",
    "Computed",
    "DeepObservable",
    "Observable",
    "RefObservable",
    "ShallowObservable",
    "autorun",
    "comparer",
    "configure",
    "isObservableProp",
    "isObservableMap",
    "isObservableArray",
    "isObservableObject",
    "isBoxedObservable",
    "isComputed",
    "isComputedProp",
    "flow",
    "flowResult",
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
});
