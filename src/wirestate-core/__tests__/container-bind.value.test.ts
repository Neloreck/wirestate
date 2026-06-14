import { BindingType, ValueBindingDescriptor } from "../binding/binding";
import { Container } from "../container/container";

describe("container.bind value", () => {
  it("should bind a value descriptor", () => {
    const TOKEN: unique symbol = Symbol("config");

    const container: Container = new Container();
    const result: Container = container.bind({
      token: TOKEN,
      value: { key: "value" },
      type: BindingType.Value,
    });

    expect(result).toBe(container);
    expect(container.get(TOKEN)).toEqual({ key: "value" });
  });

  it("should bind a value when type is undefined", () => {
    const container: Container = new Container();
    const TOKEN: unique symbol = Symbol("config");

    container.bind({ token: TOKEN, value: 42 });

    expect(container.get(TOKEN)).toBe(42);
  });

  it("should bind a value to the container", () => {
    const container: Container = new Container();
    const binding: ValueBindingDescriptor = { token: "my-token", value: "my-value" };

    const result: Container = container.bind(binding);

    expect(result).toBe(container);
    expect(container.get("my-token")).toBe("my-value");
    expect(container.getOwnBindings()).toContainEqual(binding);
  });
});
