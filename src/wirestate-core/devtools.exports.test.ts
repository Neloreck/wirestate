import { assertExportedApi } from "#/test/exported-api.utils";

describe("Library exported API from wirestate-core/devtools", () => {
  it("should export exactly the documented devtools API surface", () => {
    assertExportedApi(require.resolve("./devtools"), {
      values: [
        "DEVTOOLS_HOOK_KEY",
        "DEVTOOLS_PROTOCOL_VERSION",
        "DevToolsPlugin",
        "getDevtoolsHook",
        "installDevtoolsHook",
      ],
      types: [
        "DevToolsPluginConfig",
        "DevtoolsBinding",
        "DevtoolsContainerId",
        "DevtoolsContainerSnapshot",
        "DevtoolsEvent",
        "DevtoolsHandler",
        "DevtoolsHook",
        "DevtoolsInspectPath",
        "DevtoolsInstance",
        "DevtoolsInstanceId",
        "DevtoolsInstanceStatus",
        "DevtoolsLifecycleEvent",
        "DevtoolsLifecyclePhase",
        "DevtoolsListener",
        "DevtoolsMessage",
        "DevtoolsMessageChannel",
        "DevtoolsMessageEvent",
        "DevtoolsMessageResult",
        "DevtoolsMessageResultEvent",
        "DevtoolsMethod",
        "DevtoolsPluginInfo",
        "DevtoolsRegistration",
        "DevtoolsRegistrationEvent",
        "DevtoolsRegistrationPhase",
        "DevtoolsRoot",
        "DevtoolsRootId",
        "DevtoolsRootRegister",
        "DevtoolsRootSnapshot",
        "DevtoolsServiceRef",
        "DevtoolsToken",
      ],
    });
  });
});
