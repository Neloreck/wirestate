describe("Library exported API from wirestate-core", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    "Binding",
    "BindingDescriptor",
    "BindingScope",
    "BindingType",
    "Bindings",
    "CommandBus",
    "CommandHandler",
    "CommandType",
    "CommandUnregister",
    "CommandsPlugin",
    "Container",
    "ContainerConfig",
    "EventBus",
    "EventEmitOptions",
    "EventHandler",
    "EventType",
    "EventUnsubscribe",
    "EventsPlugin",
    "FactoryBindingDescriptor",
    "Injectable",
    "InjectionToken",
    "InstanceBindingDescriptor",
    "InternalErrorDescriptor",
    "InternalErrorHandler",
    "InternalErrorSource",
    "Newable",
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
    "QueriesPlugin",
    "ServiceToken",
    "ValueBindingDescriptor",
    "WireEvent",
    "WireStatus",
    "WirestateError",
    "WirestatePlugin",
    "defaultInternalErrorHandler",
    "inject",
    "isInjectable",
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
