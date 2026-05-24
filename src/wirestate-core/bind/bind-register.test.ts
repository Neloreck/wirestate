import { GenericService } from "@/fixtures/services/generic-service";

import { Container } from "../alias";
import { InjectableDescriptor } from "../types/provision";

import { getContainerEntries, registerContainerEntry } from "./bind-register";

describe("bind-register", () => {
  it("should return empty entries for a container without registrations", () => {
    const container: Container = new Container();

    expect(getContainerEntries(container)).toEqual([]);
  });

  it("should register container entries in insertion order", () => {
    const container: Container = new Container();
    const descriptor: InjectableDescriptor = {
      id: "CONFIG_TOKEN",
      value: "config-value",
    };

    registerContainerEntry(container, GenericService);
    registerContainerEntry(container, descriptor);

    expect(getContainerEntries(container)).toEqual([GenericService, descriptor]);
  });

  it("should keep entries isolated per container", () => {
    const firstContainer: Container = new Container();
    const secondContainer: Container = new Container();

    const firstDescriptor: InjectableDescriptor = {
      id: "FIRST_TOKEN",
      value: "first-value",
    };
    const secondDescriptor: InjectableDescriptor = {
      id: "SECOND_TOKEN",
      value: "second-value",
    };

    registerContainerEntry(firstContainer, firstDescriptor);
    registerContainerEntry(secondContainer, GenericService);
    registerContainerEntry(secondContainer, secondDescriptor);

    expect(getContainerEntries(firstContainer)).toEqual([firstDescriptor]);
    expect(getContainerEntries(secondContainer)).toEqual([GenericService, secondDescriptor]);
  });
});
