describe("Library exported API from wirestate/lit", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    "ContainerContext",
    "InjectablesProviderController",
    "InjectablesProviderControllerOptions",
    "InjectablesProviderDecorator",
    "InjectionDecorator",
    "InjectionOptions",
    "IocProviderController",
    "IocProviderControllerOptions",
    "IocProviderDecorator",
    "OnCommandController",
    "OnCommandDecorator",
    "OnEventController",
    "OnEventDecorator",
    "OnQueryController",
    "OnQueryDecorator",
    "UseInjectionOptions",
    "UseInjectionValue",
    "UseIocProvisionOptions",
    "UseOnCommandOptions",
    "UseOnEventsOptions",
    "UseOnQueryOptions",
    "injectablesProvide",
    "injection",
    "iocProvide",
    "onCommand",
    "onEvent",
    "onQuery",
    "useInjectablesProvider",
    "useInjection",
    "useIocProvision",
    "useOnCommand",
    "useOnEvents",
    "useOnQuery",
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
