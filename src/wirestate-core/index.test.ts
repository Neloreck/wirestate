describe("Library exported API from wirestate-core", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    // Aliases.
    "BindingType",
    "Container",
    "Inject",
    "Injectable",
    "LazyServiceIdentifier",
    "MultiInject",
    "Named",
    "Newable",
    "Optional",
    "BindingScope",
    "ServiceIdentifier",
    "Tagged",
    "forwardRef",
    // Core.
    "BindOptions",
    "BindingDescriptor",
    "Binding",
    "Bindings",
    "CommandBus",
    "CommandHandler",
    "CommandType",
    "CommandUnregister",
    "ContainerActivation",
    "ContainerConfig",
    "ConstantValueBindingDescriptor",
    "CreateContainerOptions",
    "DynamicValueBindingDescriptor",
    "EventBus",
    "EventEmitOptions",
    "EventHandler",
    "EventType",
    "EventUnsubscriber",
    "WireEvent",
    "FactoryBindingDescriptor",
    "InstanceBindingDescriptor",
    "OnActivated",
    "OnCommand",
    "OnDeactivation",
    "OnDeprovision",
    "OnEvent",
    "OnProvision",
    "OnQuery",
    "ProvisionLifecycle",
    "QueryBus",
    "QueryHandler",
    "QueryType",
    "QueryUnregister",
    "ResolvedValueBindingDescriptor",
    "SEED",
    "SEEDS",
    "SeedBinding",
    "SeedBindings",
    "SeedKey",
    "SeedsMap",
    "ServiceRedirectionBindingDescriptor",
    "WireScope",
    "WirestateError",
    "bind",
    "createContainer",
    "deprovisionContainer",
    "provisionContainer",
    "setSeeds",
    "setSharedSeed",
    "unbind",
    "unbindAll",
    "unsetSeeds",
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
