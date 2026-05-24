describe("Library exported API from wirestate/lit", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    "ContainerContext",
    "ContainerProvider",
    "ContainerProviderDecorator",
    "ContainerProviderOptions",
    "InjectionDecorator",
    "InjectionOptions",
    "OnCommandController",
    "OnCommandDecorator",
    "OnEventController",
    "OnEventDecorator",
    "OnQueryController",
    "OnQueryDecorator",
    "optionalInjection",
    "OptionalInjectionDecorator",
    "OptionalInjectionFallback",
    "OptionalInjectionOptions",
    "SubContainerProvider",
    "SubContainerProviderDecorator",
    "SubContainerProviderOptions",
    "UseContainerProvisionOptions",
    "UseContainerValue",
    "UseInjectionOptions",
    "UseInjectionValue",
    "UseOnCommandOptions",
    "UseOnEventsOptions",
    "UseOnQueryOptions",
    "UseOptionalInjectionOptions",
    "UseOptionalInjectionValue",
    "UseScopeValue",
    "containerProvide",
    "injection",
    "onCommand",
    "onEvent",
    "onQuery",
    "subContainerProvide",
    "useContainer",
    "useContainerProvision",
    "useInjection",
    "useOnCommand",
    "useOnEvents",
    "useOptionalInjection",
    "useOnQuery",
    "useScope",
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
