import { GenericService } from "@/fixtures/services/generic-service";

import { Container } from "../alias";
import { BindingDescriptor } from "../types/provision";

import { getContainerBindings, registerBinding } from "./register-binding";

describe("register-binding", () => {
  it("should return empty bindings for a container without registrations", () => {
    const container: Container = new Container();

    expect(getContainerBindings(container)).toEqual([]);
  });

  it("should register container bindings in insertion order", () => {
    const container: Container = new Container();
    const descriptor: BindingDescriptor = {
      id: "CONFIG_TOKEN",
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
      id: "FIRST_TOKEN",
      value: "first-value",
    };
    const secondDescriptor: BindingDescriptor = {
      id: "SECOND_TOKEN",
      value: "second-value",
    };

    registerBinding(firstContainer, firstDescriptor);
    registerBinding(secondContainer, GenericService);
    registerBinding(secondContainer, secondDescriptor);

    expect(getContainerBindings(firstContainer)).toEqual([firstDescriptor]);
    expect(getContainerBindings(secondContainer)).toEqual([GenericService, secondDescriptor]);
  });
});
