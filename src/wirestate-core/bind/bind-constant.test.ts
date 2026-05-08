import { Container } from "inversify";

import { ScopeBindingType } from "@/wirestate-core/alias";
import { bindConstant } from "@/wirestate-core/bind/bind-constant";
import { InjectableDescriptor } from "@/wirestate-core/types/privision";

describe("bindConstant", () => {
  it("should bind a constant value to the container", () => {
    const container: Container = new Container();
    const entry: InjectableDescriptor = { id: "my-token", value: "my-value" };

    bindConstant(container, entry);

    expect(container.get("my-token")).toBe("my-value");
  });

  it("should throw if scopeBindingType is provided", () => {
    const container: Container = new Container();

    expect(() =>
      bindConstant(container, {
        id: "my-token",
        value: "my-value",
        scopeBindingType: ScopeBindingType.Singleton,
      })
    ).not.toThrow();
    expect(() =>
      bindConstant(container, {
        id: "my-token",
        value: "my-value",
        scopeBindingType: ScopeBindingType.Request,
      })
    ).toThrow("Provided unexpected binding scope for constant value.");
    expect(() =>
      bindConstant(container, {
        id: "my-token",
        value: "my-value",
        scopeBindingType: ScopeBindingType.Transient,
      })
    ).toThrow("Provided unexpected binding scope for constant value.");
  });
});
