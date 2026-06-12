import { InjectionToken } from "../binding/binding-tokens";
import {
  ERROR_CODE_INVALID_ARGUMENTS,
  ERROR_CODE_INVALID_BINDING_SCOPE,
  ERROR_CODE_VALIDATION_ERROR,
} from "../error/error-code";
import { OnDeactivation } from "../lifecycle/on-deactivation";
import { Injectable } from "../metadata/metadata-injectable";

import { ContainerKernel } from "./container-kernel";
import { inject } from "./context";

const myServiceConstructorSpy = jest.fn();

@Injectable()
class MyService {
  public constructor(public name = "MyService") {
    myServiceConstructorSpy();
  }
}

describe("ContainerKernel API", () => {
  afterEach(() => {
    myServiceConstructorSpy.mockReset();
  });

  it("inject", () => {
    expect(() => inject(MyService)).toThrow("You can only invoke inject() within an injection context");

    const container = new ContainerKernel();
    const token = new InjectionToken<MyService>("some-token");

    expect(() => container.get(token)).toThrow("No binding(s) found");

    container.bind({ token: MyService, type: "Instance", value: MyService });
    container.bind({
      token: token,
      factory: () => inject(MyService),
    });

    expect(container.get(token)).toBeInstanceOf(MyService);
  });

  it("has", () => {
    const container = new ContainerKernel();
    const childContainer = new ContainerKernel(container);
    const token = new InjectionToken<MyService>("some-token");

    expect(container.has(token)).toBe(false);
    expect(childContainer.has(token)).toBe(false);

    container.bind({ token: token, type: "Instance", value: MyService });
    expect(container.has(token)).toBe(true);
    expect(childContainer.has(token)).toBe(true);

    // has shall not construct the provider
    const factoryToken = new InjectionToken<MyService>("some-factory-token");
    const spy = jest.fn();

    container.bind({
      token: factoryToken,
      factory: () => {
        spy();

        return new MyService();
      },
    });
    expect(container.has(factoryToken)).toBe(true);
    expect(spy).toHaveBeenCalledTimes(0);
    container.get(factoryToken);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should bind bare classes as singleton instance bindings", () => {
    const container = new ContainerKernel();

    container.bind(MyService);

    const instance = container.get(MyService);

    expect(instance).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(instance);
  });

  it("should reject bare classes without @Injectable", () => {
    const container = new ContainerKernel();

    class UndecoratedBareService {}

    expect(() => container.bind(UndecoratedBareService)).toThrow(
      "Class 'UndecoratedBareService' must be decorated with @Injectable() to be bound."
    );
  });

  it("should reject bindings that are not classes or descriptor objects", () => {
    const container = new ContainerKernel();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => container.bind(null as any)).toThrow(
      "Cannot bind: expected a service class or a binding descriptor object."
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => container.bind({ value: 1 } as any)).toThrow("Binding descriptor must provide a 'token' property.");
  });

  it("should attach error codes to binding validation errors", () => {
    const container = new ContainerKernel();

    class UndecoratedService {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => container.bind({ value: 1 } as any)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => container.bind({ token: "bad-type", type: "UNKNOWN", value: 1 } as any)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS })
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => container.bind({ token: "bad-scope", value: 1, scope: "UNKNOWN" } as any)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE })
    );
    expect(() => container.bind(UndecoratedService)).toThrow(
      expect.objectContaining({ code: ERROR_CODE_VALIDATION_ERROR })
    );
  });

  it("should reject instance bindings for classes without @Injectable", () => {
    const container = new ContainerKernel();

    class UndecoratedService {}

    expect(() => container.bind({ token: UndecoratedService, type: "Instance", value: UndecoratedService })).toThrow(
      "Class 'UndecoratedService' must be decorated with @Injectable() to be bound."
    );
  });

  it("should accept instance bindings once the class is decorated with @Injectable", () => {
    const container = new ContainerKernel();

    class DecoratedService {}

    expect(() => container.bind({ token: DecoratedService, type: "Instance", value: DecoratedService })).toThrow(
      "Class 'DecoratedService' must be decorated with @Injectable() to be bound."
    );

    Injectable()(DecoratedService);

    expect(() => container.bind({ token: DecoratedService, type: "Instance", value: DecoratedService })).not.toThrow();
    expect(container.get(DecoratedService)).toBeInstanceOf(DecoratedService);
  });

  describe("contexts", () => {
    it("should support nesting without interference", () => {
      const container1 = new ContainerKernel().bind({ token: "a", factory: () => "A" });
      const container2 = new ContainerKernel().bind({ token: "b", factory: () => container1.get("a") });

      const container3 = new ContainerKernel()
        .bind({ token: "c", factory: () => container2.get("b") })
        .bind({ token: "d", factory: () => inject("c") })
        .bind({ token: "e", factory: () => inject("b") });

      expect(container3.get("c")).toBe("A");
      expect(container3.get("d")).toBe("A");

      expect(() => container3.get("e")).toThrow("No binding(s) found for 'b'");
      expect(() => container3.get("b")).toThrow("No binding(s) found for 'b'");
    });
  });

  it("should unbind a single service", () => {
    const container = new ContainerKernel();

    container.bind({ token: MyService, type: "Instance", value: MyService });

    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(0);

    const myService1 = container.get(MyService);
    const myService2 = container.get(MyService);

    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
    expect(myService1).toBe(myService2);

    container.unbind(MyService);

    expect(() => container.get(MyService)).toThrow("No binding(s) found");

    container.bind({ token: MyService, type: "Instance", value: MyService });

    const myService3 = container.get(MyService);

    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(2);
    expect(myService3).not.toBe(myService1);
    expect(myService3).not.toBe(myService2);
  });

  it("should unbind all services", () => {
    const container = new ContainerKernel();
    const token = new InjectionToken<string>("value");

    container.bind({ token: token, value: "first" });

    expect(container.get(token)).toBe("first");

    container.unbindAll();

    expect(() => container.get(token)).toThrow("No binding(s) found");

    container.bind({ token: token, value: "second" });

    expect(container.get(token)).toBe("second");
  });

  describe("unbind interceptors", () => {
    it("should run interceptors before deactivation on unbind", () => {
      const events: Array<string> = [];

      @Injectable()
      class ServiceA {
        @OnDeactivation()
        public onDeactivation(): void {
          events.push("deactivate-a");
        }
      }

      const container = new ContainerKernel();

      container.bind<ServiceA>({ token: "a", type: "Instance", value: ServiceA });
      container.get("a");

      container.addUnbindInterceptor({ onUnbind: (token) => events.push(`intercept-${String(token)}`) });
      container.unbind("a");

      expect(events).toEqual(["intercept-a", "deactivate-a"]);
    });

    it("should run onUnbindAll exactly once before deactivation", () => {
      const events: Array<string> = [];

      @Injectable()
      class ServiceA {
        @OnDeactivation()
        public onDeactivation(): void {
          events.push("deactivate-a");
        }
      }

      @Injectable()
      class ServiceB {
        @OnDeactivation()
        public onDeactivation(): void {
          events.push("deactivate-b");
        }
      }

      const container = new ContainerKernel();

      container.bind<ServiceA>({ token: "a", type: "Instance", value: ServiceA });
      container.bind<ServiceB>({ token: "b", type: "Instance", value: ServiceB });
      container.get("a");
      container.get("b");

      container.addUnbindInterceptor({
        onUnbind: (token) => events.push(`intercept-${String(token)}`),
        onUnbindAll: () => events.push("intercept-all"),
      });
      container.unbindAll();

      expect(events).toEqual(["intercept-all", "deactivate-a", "deactivate-b"]);
    });

    it("should stop calling removed interceptors", () => {
      const events: Array<string> = [];
      const container = new ContainerKernel();

      container.bind({ token: "a", value: "A" });

      const remove = container.addUnbindInterceptor({
        onUnbind: () => events.push("intercept"),
        onUnbindAll: () => events.push("intercept-all"),
      });

      remove();
      container.unbind("a");
      container.unbindAll();

      expect(events).toEqual([]);
    });
  });
});
