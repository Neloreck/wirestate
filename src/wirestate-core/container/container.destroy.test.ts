import { ERROR_CODE_CONTAINER_DESTROYED } from "../error/error-code";
import { Injectable } from "../metadata/metadata-injectable";
import { EventBus } from "../plugin/events/event-bus";
import { EventsPlugin } from "../plugin/events/events-plugin";
import { OnProvision } from "../provision/on-provision";

import { Container } from "./container";
import { inject } from "./container-context";
import { ContainerKernel } from "./container-kernel";

describe("Container reset and destroy", () => {
  describe("unbindAll resets", () => {
    it("should keep the container usable, with its own infrastructure intact", () => {
      @Injectable()
      class Service {}

      const container: Container = new Container({ bindings: [Service], plugins: [new EventsPlugin()] });
      const bus: EventBus = container.get(EventBus);

      container.get(Service);
      container.unbindAll();

      expect(container.has(Service)).toBe(false);

      // Infrastructure survives, identity included, so anything holding the bus keeps working.
      expect(container.get(Container)).toBe(container);
      expect(container.get(EventBus)).toBe(bus);
    });

    it("should let the container be re-populated and re-provisioned", () => {
      const provisioned: Array<string> = [];

      @Injectable()
      class Svc {
        @OnProvision()
        public onProvision(): void {
          provisioned.push("provisioned");
        }
      }

      const container: Container = new Container({ bindings: [Svc], plugins: [new EventsPlugin()] });

      container.provision();
      container.unbindAll();

      expect(provisioned).toEqual(["provisioned"]);

      container.bind(Svc);
      container.provision();

      expect(provisioned).toEqual(["provisioned", "provisioned"]);
      expect(container.get(EventBus)).toBeInstanceOf(EventBus);
    });

    it("should remove every binding of a bare kernel, which owns no infrastructure", () => {
      const kernel: ContainerKernel = new ContainerKernel();

      kernel.bind({ token: "VALUE", value: "first" });
      kernel.unbindAll();

      expect(kernel.getOwnBindings()).toEqual([]);
    });
  });

  describe("destroy is terminal", () => {
    it("should reject every later use, including optional lookups", () => {
      @Injectable()
      class Service {}

      const container: Container = new Container({ bindings: [Service] });

      container.destroy();

      // Optional is about a structural miss, not a dead container, so it throws like the rest.
      expect(() => container.get(Service, { optional: true })).toThrow(
        expect.objectContaining({ code: ERROR_CODE_CONTAINER_DESTROYED })
      );
      expect(() => container.get(Service)).toThrow("Container was destroyed");
      expect(() => container.bind(Service)).toThrow("Container was destroyed");
      expect(() => container.unbind(Service)).toThrow("Container was destroyed");
      expect(() => container.unbindAll()).toThrow("Container was destroyed");

      // Without this guard provisioning a destroyed container quietly succeeds, since it has no
      // bindings left to walk, and the provider gets a container that resolves nothing.
      expect(() => container.provision()).toThrow("Container was destroyed");
    });

    it("should stay idempotent and keep teardown callable", () => {
      const container: Container = new Container();

      container.destroy();

      expect(() => container.destroy()).not.toThrow();
      expect(() => container.deprovision()).not.toThrow();
    });

    it("should never answer a lookup with an ancestor's binding", () => {
      @Injectable()
      class Service {
        public constructor(public readonly own: Container = inject(Container)) {}
      }

      const parent: Container = new Container({ plugins: [new EventsPlugin()] });
      const child: Container = new Container({ parent, bindings: [Service] });

      // The whole point of the terminal state: a destroyed child that still resolved would hand
      // back the parent's container and the parent's bus, silently placing callers in the
      // wrong scope.
      child.destroy();

      expect(child.has(Container)).toBe(false);
      expect(child.has(EventBus)).toBe(false);
      expect(() => child.get(Container)).toThrow("Container was destroyed");

      // The parent is untouched.
      expect(parent.get(Container)).toBe(parent);
      expect(parent.get(EventBus)).toBeInstanceOf(EventBus);
    });

    it("should explain a miss caused by a destroyed ancestor", () => {
      @Injectable()
      class ParentService {}

      @Injectable()
      class ChildService {}

      const parent: Container = new Container({ bindings: [ParentService], plugins: [new EventsPlugin()] });
      const child: Container = new Container({ parent, bindings: [ChildService] });

      child.get(ChildService);
      parent.destroy();

      expect(child.get(EventBus, { optional: true })).toBeUndefined();

      // Destroy cannot cascade, since containers keep no child pointers, so the child stays live
      // and only notices through lookups that used to resolve upwards. Reporting a plain miss
      // there names the token instead of the reason.
      expect(() => child.get(EventBus)).toThrow("a parent container was destroyed");
      expect(() => child.get(ParentService)).toThrow("a parent container was destroyed");
      expect(() => child.get(EventBus)).toThrow(expect.objectContaining({ code: ERROR_CODE_CONTAINER_DESTROYED }));

      // The child's own scope is unaffected.
      expect(child.get(ChildService)).toBeInstanceOf(ChildService);
      expect(child.has(EventBus)).toBe(false);
    });

    it("should keep a reset child resolving its own scope rather than its parent's", () => {
      const parent: Container = new Container({ plugins: [new EventsPlugin()] });
      const child: Container = new Container({ parent, plugins: [new EventsPlugin()] });

      const childBus: EventBus = child.get(EventBus);

      expect(childBus).not.toBe(parent.get(EventBus));

      child.unbindAll();

      expect(child.get(Container)).toBe(child);
      expect(child.get(EventBus)).toBe(childBus);
    });
  });
});
