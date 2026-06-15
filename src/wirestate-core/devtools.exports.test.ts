describe("Library exported API from wirestate-core/devtools", () => {
  const devtoolsRoot = require("./devtools");

  const expectedExports: Array<string> = [
    "DEVTOOLS_HOOK_KEY",
    "DEVTOOLS_PROTOCOL_VERSION",
    "DevToolsPlugin",
    "getDevtoolsHook",
    "installDevtoolsHook",
  ];

  const assertListIntersection = (first: Array<string>, second: Array<string>) => {
    first.forEach((it: string) => {
      if (!second.includes(it)) {
        throw new Error("Item missing in expected list: " + it);
      }
    });
    second.forEach((it: string) => {
      if (!first.includes(it)) {
        throw new Error("Item missing in devtools root: " + it);
      }
    });
  };

  it("should export the devtools API (type-only exports erase at runtime)", () => {
    assertListIntersection(Object.keys(devtoolsRoot), expectedExports);
    expect(Object.keys(devtoolsRoot)).toHaveLength(expectedExports.length);
  });
});
