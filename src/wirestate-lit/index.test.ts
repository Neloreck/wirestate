describe("Library exported API from wirestate/lit", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    "ContainerContext",
    "ContainerProviderController",
    "ContainerProviderControllerOptions",
    "ContainerProviderDecorator",
    "InjectionDecorator",
    "InjectionOptions",
    "OnCommandController",
    "OnCommandDecorator",
    "OnEventController",
    "OnEventDecorator",
    "OnQueryController",
    "OnQueryDecorator",
    "SubContainerProviderController",
    "SubContainerProviderControllerOptions",
    "SubContainerProviderDecorator",
    "UseContainerProvisionOptions",
    "UseInjectionOptions",
    "UseInjectionValue",
    "UseOnCommandOptions",
    "UseOnEventsOptions",
    "UseOnQueryOptions",
    "containerProvide",
    "injection",
    "onCommand",
    "onEvent",
    "onQuery",
    "subContainerProvide",
    "useContainerProvision",
    "useInjection",
    "useOnCommand",
    "useOnEvents",
    "useOnQuery",
    "useSubContainerProvider",
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
