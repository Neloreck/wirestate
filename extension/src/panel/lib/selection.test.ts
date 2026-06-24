import { mockBinding, mockContainerSnapshot, mockInstance, mockPluginInfo, mockRootSnapshot } from "@/fixtures/devtools";

import { getTokenOfInstanceId, isSameSelection, resolveSelection } from "@/panel/lib/selection";

describe("resolveSelection", () => {
  const roots = [
    mockRootSnapshot(1, [
      mockContainerSnapshot(1, null, {
        instances: [mockInstance("Foo")],
        bindings: [mockBinding("Bar")],
        plugins: [mockPluginInfo("Baz")],
      }),
    ]),
  ];

  it("resolves a live entity", () => {
    expect(resolveSelection(roots, { kind: "container", containerId: 1 })?.kind).toBe("container");
    expect(resolveSelection(roots, { kind: "binding", containerId: 1, token: "Bar" })?.kind).toBe("binding");
    expect(resolveSelection(roots, { kind: "plugin", containerId: 1, name: "Baz" })?.kind).toBe("plugin");
  });

  it("returns undefined when the entity is gone (tombstone trigger)", () => {
    expect(resolveSelection(roots, { kind: "container", containerId: 999 })).toBeUndefined();
    expect(resolveSelection(roots, { kind: "binding", containerId: 1, token: "Gone" })).toBeUndefined();
  });
});

describe("getTokenOfInstanceId", () => {
  const roots = [
    mockRootSnapshot(1, [mockContainerSnapshot(1, null, { instances: [mockInstance("SvcImpl", "Service", 7)] })]),
  ];

  it("maps an instance id to its realizing binding's token", () => {
    expect(getTokenOfInstanceId(roots, 1, 7)).toBe("Service");
  });

  it("is undefined for an unknown instance or container", () => {
    expect(getTokenOfInstanceId(roots, 1, 999)).toBeUndefined();
    expect(getTokenOfInstanceId(roots, 999, 7)).toBeUndefined();
  });
});

describe("isSameSelection", () => {
  it("compares kind, container, and the entity key", () => {
    expect(isSameSelection({ kind: "container", containerId: 1 }, { kind: "container", containerId: 1 })).toBe(true);
    expect(isSameSelection({ kind: "container", containerId: 1 }, { kind: "container", containerId: 2 })).toBe(false);
    expect(
      isSameSelection({ kind: "binding", containerId: 1, token: "A" }, { kind: "binding", containerId: 1, token: "A" })
    ).toBe(true);
    expect(
      isSameSelection({ kind: "binding", containerId: 1, token: "A" }, { kind: "binding", containerId: 1, token: "B" })
    ).toBe(false);
    expect(isSameSelection({ kind: "container", containerId: 1 }, { kind: "plugin", containerId: 1, name: "A" })).toBe(
      false
    );
  });
});
