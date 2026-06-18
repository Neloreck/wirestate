import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate/lit", () => {
  it("should export exactly the documented lit API surface", () => {
    assertExportedApi(require.resolve("./index"), {
      values: [
        "ContainerContext",
        "ContainerProvider",
        "OnCommandController",
        "OnEventController",
        "OnQueryController",
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
      ],
      types: [
        "ContainerProviderOptions",
        "InjectionDecorator",
        "InjectionOptions",
        "OnCommandDecorator",
        "OnEventDecorator",
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
      ],
    });
  });
});
