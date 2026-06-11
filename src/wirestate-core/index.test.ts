describe("Library exported API from wirestate-core", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    "Binding",
    "BindingDescriptor",
    "BindingScope",
    "BindingType",
    "Bindings",
    "CircularDependencyError",
    "CommandBus",
    "CommandHandler",
    "CommandType",
    "CommandUnregister",
    "Container",
    "ContainerConfig",
    "ContainerOptions",
    "ContainerProvisionLifecycle",
    "EventBus",
    "EventEmitOptions",
    "EventHandler",
    "EventType",
    "EventUnsubscriber",
    "FactoryBindingDescriptor",
    "Identifier",
    "Injectable",
    "InjectionToken",
    "InstanceBindingDescriptor",
    "InternalErrorDescriptor",
    "InternalErrorHandler",
    "InternalErrorSource",
    "Newable",
    "NoBindingFoundError",
    "OnActivated",
    "OnCommand",
    "OnCommandHandlerDecorator",
    "OnDeactivation",
    "OnDeprovision",
    "OnEvent",
    "OnEventHandlerDecorator",
    "OnProvision",
    "OnQuery",
    "OnQueryHandlerDecorator",
    "ProvisionId",
    "QueryBus",
    "QueryHandler",
    "QueryType",
    "QueryUnregister",
    "SEED",
    "SEEDS",
    "SeedBinding",
    "SeedBindings",
    "SeedKey",
    "SeedsMap",
    "ValueBindingDescriptor",
    "WireEvent",
    "WireScope",
    "WireStatus",
    "WirestateError",
    "defaultInternalErrorHandler",
    "deprovisionContainer",
    "inject",
    "isInjectable",
    "provisionContainer",
    "validateContainerConfig",
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
