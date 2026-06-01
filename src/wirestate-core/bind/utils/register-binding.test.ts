import { GenericService } from "@/fixtures/services/generic-service";

import { Container } from "../../alias";
import { BindingDescriptor } from "../../types/provision";

import { getContainerBindings, registerBinding, unregisterAllBindings, unregisterBinding } from "./register-binding";

describe("register-binding", () => {
  it("should return empty bindings for a container without registrations", () => {
    const container: Container = new Container();

    expect(getContainerBindings(container)).toEqual([]);
  });

  it("should register container bindings in insertion order", () => {
    const container: Container = new Container();
    const descriptor: BindingDescriptor = {
      token: "CONFIG_TOKEN",
      value: "config-value",
    };

    registerBinding(container, GenericService);
    registerBinding(container, descriptor);

    expect(getContainerBindings(container)).toEqual([GenericService, descriptor]);
  });

  it("should keep bindings isolated per container", () => {
    const firstContainer: Container = new Container();
    const secondContainer: Container = new Container();

    const firstDescriptor: BindingDescriptor = {
      token: "FIRST_TOKEN",
      value: "first-value",
    };
    const secondDescriptor: BindingDescriptor = {
      token: "SECOND_TOKEN",
      value: "second-value",
    };

    registerBinding(firstContainer, firstDescriptor);
    registerBinding(secondContainer, GenericService);
    registerBinding(secondContainer, secondDescriptor);

    expect(getContainerBindings(firstContainer)).toEqual([firstDescriptor]);
    expect(getContainerBindings(secondContainer)).toEqual([GenericService, secondDescriptor]);
  });

  it("should unregister all bindings for a token", () => {
    const container: Container = new Container();
    const descriptor: BindingDescriptor = {
      token: GenericService,
      value: "shadow",
    };
    const remaining: BindingDescriptor = {
      token: "CONFIG_TOKEN",
      value: "config-value",
    };

    registerBinding(container, GenericService);
    registerBinding(container, descriptor);
    registerBinding(container, remaining);
    unregisterBinding(container, GenericService);

    expect(getContainerBindings(container)).toEqual([remaining]);
  });

  it("should unregister all container bindings", () => {
    const container: Container = new Container();
    const descriptor: BindingDescriptor = {
      token: "CONFIG_TOKEN",
      value: "config-value",
    };

    registerBinding(container, GenericService);
    registerBinding(container, descriptor);
    unregisterAllBindings(container);

    expect(getContainerBindings(container)).toEqual([]);
  });
});
