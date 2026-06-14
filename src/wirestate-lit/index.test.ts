describe("Library exported API from wirestate/lit", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    "ContainerContext",
    "ContainerProvider",
    "ContainerProviderOptions",
    "ContainerProviderScope",
    "ContainerProviderScopeValue",
    "InjectionDecorator",
    "InjectionOptions",
    "OnCommandController",
    "OnCommandDecorator",
    "OnEventController",
    "OnEventDecorator",
    "OnQueryController",
    "OnQueryDecorator",
    "OptionalInjectionDecorator",
    "OptionalInjectionFallback",
    "OptionalInjectionOptions",
    "ProvideContainerDecorator",
    "UseContainerProviderOptions",
    "UseContainerValue",
    "UseInjectionOptions",
    "UseInjectionValue",
    "UseOnCommandOptions",
    "UseOnEventsOptions",
    "UseOnQueryOptions",
    "UseOptionalInjectionOptions",
    "UseOptionalInjectionValue",
    "injection",
    "onCommand",
    "onEvent",
    "onQuery",
    "optionalInjection",
    "provideContainer",
    "useContainer",
    "useContainerProvider",
    "useInjection",
    "useOnCommand",
    "useOnEvents",
    "useOnQuery",
    "useOptionalInjection",
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
