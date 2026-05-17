describe("Library exported API from wirestate-core", () => {
  const libRoot = require("./index");

  const expectedLibExports: Array<string> = [
    // Aliases.
    "AbstractNewable",
    "Bind",
    "BindInFluentSyntax",
    "BindInWhenOnFluentSyntax",
    "BindOnFluentSyntax",
    "BindToFluentSyntax",
    "BindWhenFluentSyntax",
    "BindWhenOnFluentSyntax",
    "BindingActivation",
    "BindingConstraints",
    "BindingDeactivation",
    "BindingIdentifier",
    "BindingScope",
    "BindingType",
    "BoundServiceSyntax",
    "Container",
    "ContainerModule",
    "ContainerModuleLoadOptions",
    "ContainerOptions",
    "DynamicValueBuilder",
    "Factory",
    "GetAllOptions",
    "GetOptions",
    "GetOptionsTagConstraint",
    "Inject",
    "InjectFromBase",
    "InjectFromBaseOptions",
    "InjectFromBaseOptionsLifecycle",
    "InjectFromHierarchy",
    "InjectFromHierarchyOptions",
    "InjectFromHierarchyOptionsLifecycle",
    "Injectable",
    "IsBound",
    "IsBoundOptions",
    "LazyServiceIdentifier",
    "MapToResolvedValueInjectOptions",
    "MetadataName",
    "MetadataTag",
    "MultiInject",
    "MultiInjectOptions",
    "Named",
    "Newable",
    "Optional",
    "OptionalGetOptions",
    "PostConstruct",
    "PreDestroy",
    "Rebind",
    "RebindSync",
    "ResolutionContext",
    "ResolvedValueInjectOptions",
    "ResolvedValueMetadataInjectOptions",
    "ResolvedValueMetadataInjectTagOptions",
    "ScopeBindingType",
    "ServiceIdentifier",
    "Tagged",
    "Unbind",
    "UnbindSync",
    "Unmanaged",
    "bindingScopeValues",
    "bindingTypeValues",
    "forwardRef",
    // Core.
    "BindEntryOptions",
    "BindServiceOptions",
    "CommandBus",
    "CommandDescriptor",
    "CommandHandler",
    "CommandStatus",
    "CommandType",
    "CommandUnregister",
    "CreateContainerOptions",
    "Event",
    "EventBus",
    "EventHandler",
    "EventType",
    "EventUnsubscriber",
    "InjectableDescriptor",
    "OnActivated",
    "OnCommand",
    "OnDeactivation",
    "OnEvent",
    "OnQuery",
    "QueryBus",
    "QueryHandler",
    "QueryType",
    "QueryUnregister",
    "SEED",
    "SEEDS",
    "SeedEntries",
    "SeedEntry",
    "SeedKey",
    "SeedsMap",
    "WireScope",
    "WirestateError",
    "applySeeds",
    "applySharedSeed",
    "bindConstant",
    "bindDynamicValue",
    "bindEntry",
    "bindService",
    "command",
    "commandOptional",
    "createContainer",
    "emitEvent",
    "getEntryToken",
    "query",
    "queryOptional",
    "unapplySeeds",
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
