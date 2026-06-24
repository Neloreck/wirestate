import { type DevtoolsBinding } from "@wirestate/core/devtools";

import { mockBinding, mockContainerSnapshot, mockInstance } from "@/fixtures/devtools";

import { getBindingStatus, mayRealizeInstance, realizingInstance } from "@/panel/lib/binding";

describe("realizingInstance", () => {
  it("matches by token name or implementation class", () => {
    const containerSnapshot = mockContainerSnapshot(1, null, {
      instances: [mockInstance("ServiceImplementation", "Service")],
    });

    expect(realizingInstance(containerSnapshot, mockBinding("Service"))?.className).toBe("ServiceImplementation");
    expect(realizingInstance(containerSnapshot, mockBinding("Other", "ServiceImplementation"))?.className).toBe(
      "ServiceImplementation"
    );
    expect(realizingInstance(containerSnapshot, mockBinding("None", "Nope"))).toBeUndefined();
  });
});

describe("mayRealizeInstance", () => {
  it("is true only for singleton instance bindings", () => {
    const binding = (type: DevtoolsBinding["type"], scope: DevtoolsBinding["scope"]): DevtoolsBinding => ({
      bindingId: 1,
      token: { name: "Service", kind: "class" },
      type,
      scope,
      implementation: undefined,
    });

    expect(mayRealizeInstance(binding("Instance", "Singleton"))).toBe(true);
    expect(mayRealizeInstance(binding("Instance", "Transient"))).toBe(false);
    expect(mayRealizeInstance(binding("Factory", "Singleton"))).toBe(false);
    expect(mayRealizeInstance(binding("Value", "Singleton"))).toBe(false);
  });
});

describe("getBindingStatus", () => {
  const value: DevtoolsBinding = {
    bindingId: 1,
    token: { name: "config", kind: "string" },
    type: "Value",
    scope: "Singleton",
    implementation: undefined,
  };

  // mockBinding builds an Instance/Singleton binding
  const singleton = mockBinding("Service");

  it("is 'none' for a non-instance binding (Value/Factory/Transient)", () => {
    expect(getBindingStatus(mockContainerSnapshot(1), value)).toBe("none");
  });

  it("is 'unrealized' for a singleton instance binding with no live instance", () => {
    expect(getBindingStatus(mockContainerSnapshot(1, null, { instances: [] }), singleton)).toBe("unrealized");
  });

  it("is 'active' when the realizing instance is live", () => {
    const container = mockContainerSnapshot(1, null, { instances: [mockInstance("Service")] });

    expect(getBindingStatus(container, singleton)).toBe("active");
  });

  it("is 'inactive' when the realizing instance is inactive", () => {
    const inactive = {
      ...mockInstance("Service"),
      status: { isDeactivated: true, isDeprovisioned: true, isInactive: true, provisionId: null },
    };
    const container = mockContainerSnapshot(1, null, { instances: [inactive] });

    expect(getBindingStatus(container, singleton)).toBe("inactive");
  });
});
