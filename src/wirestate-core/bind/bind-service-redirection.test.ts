import { GenericService } from "@/fixtures/services/generic-service";

import { BindingType, Container } from "../alias";
import { createContainer } from "../container/create-container";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { BindingDescriptor } from "../types/provision";

import { getContainerBindings } from "./bind-register";
import { bindService } from "./bind-service";
import { bindServiceRedirection } from "./bind-service-redirection";

describe("bindServiceRedirection", () => {
  it("should bind a service redirection descriptor", () => {
    const container: Container = createContainer();
    const TOKEN: unique symbol = Symbol("generic-service-alias");
    const binding: BindingDescriptor<GenericService> = {
      bindingType: BindingType.ServiceRedirection,
      id: TOKEN,
      service: GenericService,
    };

    bindService(container, GenericService);

    const result: Container = bindServiceRedirection(container, binding);

    expect(result).toBe(container);
    expect(container.get(TOKEN)).toBe(container.get(GenericService));
    expect(getContainerBindings(container)).toEqual([GenericService, binding]);
  });

  it("should throw if id is missing", () => {
    const container: Container = new Container();
    const binding = {
      bindingType: BindingType.ServiceRedirection,
      service: GenericService,
    } as unknown as BindingDescriptor;

    expect(() => bindServiceRedirection(container, binding)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindServiceRedirection(container, binding)).toThrow("Binding descriptor must provide an 'id' token.");
  });

  it("should throw if service is missing", () => {
    const container: Container = new Container();

    expect(() =>
      bindServiceRedirection(container, {
        bindingType: BindingType.ServiceRedirection,
        id: "redirected-binding",
      } as BindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindServiceRedirection(container, {
        bindingType: BindingType.ServiceRedirection,
        id: "redirected-binding",
      } as BindingDescriptor)
    ).toThrow("Service redirection descriptor must provide a 'service' token.");
  });

  it("should throw if descriptor uses another binding type", () => {
    const container: Container = new Container();

    expect(() =>
      bindServiceRedirection(container, {
        bindingType: BindingType.Instance,
        id: "redirected-binding",
        service: GenericService,
      })
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindServiceRedirection(container, {
        bindingType: BindingType.Instance,
        id: "redirected-binding",
        service: GenericService,
      })
    ).toThrow("bindServiceRedirection expected binding type 'ServiceRedirection'.");
  });
});
