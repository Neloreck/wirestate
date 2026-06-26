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
        "provideContainer",
        "useContainer",
        "useContainerProvider",
        "useInjection",
        "useOnCommand",
        "useOnEvents",
        "useOnQuery",
      ],
      types: [
        "ContainerProviderOptions",
        "InjectionDecorator",
        "InjectionFallback",
        "InjectionOptions",
        "OnCommandDecorator",
        "OnEventDecorator",
        "OnQueryDecorator",
        "ProvideContainerDecorator",
        "UseContainerProviderOptions",
        "UseContainerValue",
        "UseInjectionOptions",
        "UseInjectionValue",
        "UseOnCommandOptions",
        "UseOnEventsOptions",
        "UseOnQueryOptions",
      ],
    });
  });
});
