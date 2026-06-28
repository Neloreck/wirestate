import { OnActivation } from "../activation/on-activation";
import { OnDeactivation } from "../activation/on-deactivation";
import { BindingScope, BindingType } from "../binding/binding";
import { ERROR_CODE_INVALID_BINDING_SCOPE } from "../error/error-code";
import { Injectable } from "../metadata/metadata-injectable";
import { OnEvent } from "../plugin/events/on-event";
import { OnDeprovision } from "../provision/on-deprovision";
import { OnProvision } from "../provision/on-provision";

import { Container } from "./container";
import { inject } from "./container-context";

describe("container.bind transient instance", () => {
  describe("accepted: plain @Injectable classes", () => {
    it("should construct a fresh instance on every resolution", () => {
      const container: Container = new Container();
      const constructed = jest.fn();

      @Injectable()
      class CounterService {
        public constructor() {
          constructed();
        }
      }

      container.bind({ token: CounterService, type: BindingType.Instance, value: CounterService, scope: "Transient" });

      const first: CounterService = container.get(CounterService);
      const second: CounterService = container.get(CounterService);

      expect(first).toBeInstanceOf(CounterService);
      expect(first).not.toBe(second);
      expect(constructed).toHaveBeenCalledTimes(2);
    });

    it("should resolve a fresh instance through a child container", () => {
      @Injectable()
      class CounterService {}

      const parent: Container = new Container({
        bindings: [{ token: CounterService, type: BindingType.Instance, value: CounterService, scope: "Transient" }],
      });
      const child: Container = new Container({ parent });

      expect(child.get(CounterService)).toBeInstanceOf(CounterService);
      expect(child.get(CounterService)).not.toBe(child.get(CounterService));
    });

    it("should resolve constructor injection inside the fresh instance", () => {
      @Injectable()
      class CounterService {
        public constructor(public readonly container: Container = inject(Container)) {}
      }

      const container: Container = new Container({
        bindings: [{ token: CounterService, type: BindingType.Instance, value: CounterService, scope: "Transient" }],
      });

      expect(container.get(CounterService).container.get(Container)).toBe(container);
    });

    it("should keep rebinding allowed (transients own no constructed value)", () => {
      @Injectable()
      class CounterService {}

      const container: Container = new Container();

      container.bind({ token: CounterService, type: BindingType.Instance, value: CounterService, scope: "Transient" });
      expect(container.get(CounterService)).toBeInstanceOf(CounterService);

      expect(() =>
        container.bind({ token: CounterService, type: BindingType.Instance, value: CounterService, scope: "Transient" })
      ).not.toThrow();
    });

    it("should never appear in getActiveInstances", () => {
      @Injectable()
      class CounterService {}

      const container: Container = new Container({
        bindings: [{ token: CounterService, type: BindingType.Instance, value: CounterService, scope: "Transient" }],
      });

      container.get(CounterService);
      container.get(CounterService);

      expect(container.getActiveInstances()).toHaveLength(0);
    });
  });

  describe("rejected at bind time: declared lifecycle / messaging handlers", () => {
    it("should reject a transient instance declaring @OnActivation", () => {
      @Injectable()
      class Service {
        @OnActivation()
        public onActivation(): void {}
      }

      const container: Container = new Container();

      expect(() =>
        container.bind({ token: Service, type: BindingType.Instance, value: Service, scope: BindingScope.Transient })
      ).toThrow(
        expect.objectContaining({
          code: ERROR_CODE_INVALID_BINDING_SCOPE,
          message:
            "Cannot bind 'Service' as a Transient instance: a transient instance binding must declare no lifecycle or" +
            " messaging handlers, but found @OnActivation. Bind it as Singleton, or use a Transient factory binding.",
        })
      );
    });

    it("should reject a transient instance declaring @OnDeactivation", () => {
      @Injectable()
      class Service {
        @OnDeactivation()
        public onDeactivation(): void {}
      }

      const container: Container = new Container();

      expect(() =>
        container.bind({ token: Service, type: BindingType.Instance, value: Service, scope: BindingScope.Transient })
      ).toThrow("@OnDeactivation");
    });

    it("should reject a transient instance declaring @OnProvision", () => {
      @Injectable()
      class Service {
        @OnProvision()
        public onProvision(): void {}
      }

      const container: Container = new Container();

      expect(() =>
        container.bind({ token: Service, type: BindingType.Instance, value: Service, scope: BindingScope.Transient })
      ).toThrow("@OnProvision");
    });

    it("should reject a transient instance declaring @OnDeprovision", () => {
      @Injectable()
      class Service {
        @OnDeprovision()
        public onDeprovision(): void {}
      }

      const container: Container = new Container();

      expect(() =>
        container.bind({ token: Service, type: BindingType.Instance, value: Service, scope: BindingScope.Transient })
      ).toThrow("@OnDeprovision");
    });

    it("should reject a transient instance declaring a messaging handler", () => {
      @Injectable()
      class Service {
        @OnEvent("SOME_EVENT")
        public onEvent(): void {}
      }

      const container: Container = new Container();

      expect(() =>
        container.bind({ token: Service, type: BindingType.Instance, value: Service, scope: BindingScope.Transient })
      ).toThrow("messaging handler");
    });

    it("should reject a transient instance inheriting a handler from a base class", () => {
      @Injectable()
      class Base {
        @OnDeactivation()
        public onDeactivation(): void {}
      }

      @Injectable()
      class Derived extends Base {}

      const container: Container = new Container();

      expect(() =>
        container.bind({ token: Derived, type: BindingType.Instance, value: Derived, scope: BindingScope.Transient })
      ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_BINDING_SCOPE }));
      expect(() =>
        container.bind({ token: Derived, type: BindingType.Instance, value: Derived, scope: BindingScope.Transient })
      ).toThrow("@OnDeactivation");
    });

    it("should check the implementation class, not the token, for a subclass-behind-a-token binding", () => {
      abstract class Animal {}

      @Injectable()
      class Dog extends Animal {
        @OnProvision()
        public onProvision(): void {}
      }

      const container: Container = new Container();

      // The handler is on `value` (Dog), while `token` (Animal) declares none.
      expect(() =>
        container.bind({ token: Animal, type: BindingType.Instance, value: Dog, scope: BindingScope.Transient })
      ).toThrow("@OnProvision");
    });

    it("should list every offending handler in the error message", () => {
      @Injectable()
      class Service {
        @OnActivation()
        public onActivation(): void {}

        @OnEvent("SOME_EVENT")
        public onEvent(): void {}
      }

      const container: Container = new Container();

      const bind = (): unknown =>
        container.bind({ token: Service, type: BindingType.Instance, value: Service, scope: BindingScope.Transient });

      expect(bind).toThrow("@OnActivation");
      expect(bind).toThrow("messaging handler");
      expect(bind).toThrow("Bind it as Singleton, or use a Transient factory binding.");
    });
  });
});
