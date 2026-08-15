import { OnActivation } from "../activation/on-activation";
import { OnDeactivation } from "../activation/on-deactivation";
import { BindingType } from "../binding/binding";
import { InjectionToken } from "../binding/binding-tokens";
import { ERROR_CODE_INVALID_ARGUMENTS } from "../error/error-code";
import { Injectable } from "../metadata/metadata-injectable";
import { EventsPlugin } from "../plugin/events/events-plugin";
import { OnEvent } from "../plugin/events/on-event";
import { OnDeprovision } from "../provision/on-deprovision";
import { OnProvision } from "../provision/on-provision";

import { Container } from "./container";

describe("Container bind of value / factory bindings declaring owned lifecycle", () => {
  describe("rejected at bind time", () => {
    it("should reject a factory binding whose class token declares @OnProvision", () => {
      @Injectable()
      class Service {
        @OnProvision()
        public onProvision(): void {}
      }

      const container: Container = new Container();

      expect(() => container.bind({ token: Service, type: BindingType.Factory, factory: () => new Service() })).toThrow(
        expect.objectContaining({
          code: ERROR_CODE_INVALID_ARGUMENTS,
          message:
            "Cannot bind 'Service' as a Factory binding: the container does not own the value it produces, so no" +
            " lifecycle or messaging handler can fire for it, but the class declares @OnProvision. Bind it as an" +
            " Instance binding so the container owns the instance, or remove the handlers.",
        })
      );
    });

    it("should reject a value binding whose class token declares @OnDeprovision", () => {
      @Injectable()
      class Service {
        @OnDeprovision()
        public onDeprovision(): void {}
      }

      const container: Container = new Container();

      expect(() => container.bind({ token: Service, type: BindingType.Value, value: new Service() })).toThrow(
        expect.objectContaining({
          code: ERROR_CODE_INVALID_ARGUMENTS,
          message: expect.stringContaining("as a Value binding"),
        })
      );
    });

    it("should reject a factory binding whose class token declares a messaging handler", () => {
      @Injectable()
      class Service {
        @OnEvent("SOME_EVENT")
        public onEvent(): void {}
      }

      const container: Container = new Container();

      expect(() => container.bind({ token: Service, type: BindingType.Factory, factory: () => new Service() })).toThrow(
        "a messaging handler (@OnEvent/@OnCommand/@OnQuery)"
      );
    });

    it("should reject an inherited handler declared on an ancestor", () => {
      @Injectable()
      class Base {
        @OnProvision()
        public onProvision(): void {}
      }

      @Injectable()
      class Service extends Base {}

      const container: Container = new Container();

      expect(() => container.bind({ token: Service, type: BindingType.Factory, factory: () => new Service() })).toThrow(
        "@OnProvision"
      );
    });

    it("should reject a descriptor that omits an explicit type", () => {
      @Injectable()
      class Service {
        @OnProvision()
        public onProvision(): void {}
      }

      const container: Container = new Container();

      // No `type`, but a `factory` field, so the kernel classifies it as a Factory binding.
      expect(() => container.bind({ token: Service, factory: () => new Service() })).toThrow("as a Factory binding");
    });

    it("should reject the binding when it is declared through container config", () => {
      @Injectable()
      class Service {
        @OnProvision()
        public onProvision(): void {}
      }

      expect(
        () =>
          new Container({
            bindings: [{ token: Service, type: BindingType.Factory, factory: () => new Service() }],
          })
      ).toThrow(expect.objectContaining({ code: ERROR_CODE_INVALID_ARGUMENTS }));
    });

    it("should not preempt the structural error for an unrecognized type", () => {
      @Injectable()
      class Service {
        @OnProvision()
        public onProvision(): void {}
      }

      const container: Container = new Container();
      const binding = { type: "UNKNOWN", token: Service, value: Service } as unknown as Parameters<
        Container["bind"]
      >[0];

      expect(() => container.bind(binding)).toThrow("Binding descriptor has unknown type 'UNKNOWN'.");
    });

    it("should not preempt the structural error for a descriptor missing its kind fields", () => {
      @Injectable()
      class Service {
        @OnProvision()
        public onProvision(): void {}
      }

      const container: Container = new Container();

      expect(() => container.bind({ token: Service, type: BindingType.Factory } as never)).toThrow(
        "Factory descriptor 'factory' must be a function."
      );
      expect(() => container.bind({ token: Service, type: BindingType.Value } as never)).toThrow(
        "Value descriptor must provide a 'value' property."
      );
    });
  });

  describe("left alone", () => {
    it("should allow activation-phase hooks, which stay inert for these binding kinds", () => {
      const events: Array<string> = [];

      @Injectable()
      class Service {
        @OnActivation()
        public onActivation(): void {
          events.push("activated");
        }

        @OnDeactivation()
        public onDeactivation(): void {
          events.push("deactivated");
        }
      }

      const container: Container = new Container();

      expect(() =>
        container.bind({ token: Service, type: BindingType.Factory, factory: () => new Service() })
      ).not.toThrow();

      container.get(Service);
      container.unbind(Service);

      expect(events).toEqual([]);
    });

    it("should allow a value or factory binding under a non-class token", () => {
      const VALUE_TOKEN: InjectionToken<object> = new InjectionToken("VALUE_TOKEN");
      const FACTORY_TOKEN: InjectionToken<object> = new InjectionToken("FACTORY_TOKEN");

      @Injectable()
      class Service {
        @OnProvision()
        public onProvision(): void {}
      }

      const container: Container = new Container();

      expect(() => container.bind({ token: VALUE_TOKEN, type: BindingType.Value, value: new Service() })).not.toThrow();
      expect(() =>
        container.bind({ token: FACTORY_TOKEN, type: BindingType.Factory, factory: () => new Service() })
      ).not.toThrow();
    });

    it("should allow a factory binding whose class token declares no handlers", () => {
      @Injectable()
      class Service {
        public value: number = 1;
      }

      const container: Container = new Container();

      expect(() =>
        container.bind({ token: Service, type: BindingType.Factory, factory: () => new Service() })
      ).not.toThrow();

      expect(container.get(Service).value).toBe(1);
    });

    it("should still allow an instance binding declaring owned lifecycle", () => {
      @Injectable()
      class Service {
        public provisioned: boolean = false;

        @OnProvision()
        public onProvision(): void {
          this.provisioned = true;
        }
      }

      const container: Container = new Container({ bindings: [Service], plugins: [new EventsPlugin()] });

      container.provision();

      expect(container.get(Service).provisioned).toBe(true);
    });
  });
});
