import { GenericService } from "@/fixtures/services/generic-service";

import { BindingType, Container } from "../alias";
import { createContainer } from "../container/create-container";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { ServiceRedirectionBindingDescriptor } from "../types/provision";

import { bind } from "./bind";
import { bindServiceRedirection } from "./bind-service-redirection";
import { getContainerBindings } from "./register-binding";

describe("bindServiceRedirection", () => {
  it("should bind a service redirection descriptor", () => {
    const container: Container = createContainer();
    const TOKEN: unique symbol = Symbol("generic-service-alias");
    const binding: ServiceRedirectionBindingDescriptor<GenericService> = {
      bindingType: BindingType.ServiceRedirection,
      token: TOKEN,
      service: GenericService,
    };

    bind(container, GenericService);

    const result: Container = bindServiceRedirection(container, binding);

    expect(result).toBe(container);
    expect(container.get(TOKEN)).toBe(container.get(GenericService));
    expect(getContainerBindings(container)).toEqual([GenericService, binding]);
  });

  it("should throw if token is missing", () => {
    const container: Container = new Container();
    const binding = {
      bindingType: BindingType.ServiceRedirection,
      service: GenericService,
    } as unknown as ServiceRedirectionBindingDescriptor;

    expect(() => bindServiceRedirection(container, binding)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    expect(() => bindServiceRedirection(container, binding)).toThrow("Binding descriptor must provide a 'token' property.");
  });

  it("should throw if service is missing", () => {
    const container: Container = new Container();

    expect(() =>
      bindServiceRedirection(container, {
        bindingType: BindingType.ServiceRedirection,
        token: "redirected-binding",
      } as ServiceRedirectionBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindServiceRedirection(container, {
        bindingType: BindingType.ServiceRedirection,
        token: "redirected-binding",
      } as ServiceRedirectionBindingDescriptor)
    ).toThrow("Service redirection descriptor must provide a 'service' token.");
  });

  it("should throw if descriptor uses another binding type", () => {
    const container: Container = new Container();

    expect(() =>
      bindServiceRedirection(container, {
        bindingType: BindingType.Instance,
        token: "redirected-binding",
        service: GenericService,
      } as unknown as ServiceRedirectionBindingDescriptor)
    ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    expect(() =>
      bindServiceRedirection(container, {
        bindingType: BindingType.Instance,
        token: "redirected-binding",
        service: GenericService,
      } as unknown as ServiceRedirectionBindingDescriptor)
    ).toThrow("bindServiceRedirection expected binding type 'ServiceRedirection'.");
  });
});
