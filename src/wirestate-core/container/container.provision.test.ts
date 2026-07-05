import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { WireStatus } from "../activation/wire-status";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { Injectable } from "../metadata/metadata-injectable";
import { OnEvent } from "../plugin/events/on-event";
import { getProvisionState } from "../provision/provision-state";

import { Container } from "./container";

describe("Container provision", () => {
  describe("provision and deprovision", () => {
    it("runs @OnProvision on provision and @OnDeprovision on deprovision", () => {
      const { LifecycleService, events } = createLifecycleService({ methods: ["provision", "deprovision"] });
      const container: Container = new Container({ bindings: [LifecycleService] });

      container.provision();
      expect(events).toEqual(["provision"]);

      container.deprovision();
      expect(events).toEqual(["provision", "deprovision"]);
    });

    it("provisions only the decorated services among the container's own bindings", () => {
      const events: Array<string> = [];

      @Injectable()
      class PlainService {
        public constructor() {
          events.push("plain-constructed");
        }
      }

      const { LifecycleService } = createLifecycleService({ events, methods: ["provision", "deprovision"] });
      const container: Container = new Container({ bindings: [PlainService, LifecycleService] });

      // The default scan walks every own binding (container self-binding, buses,
      // both services) but only resolves and provisions participants.
      container.provision();

      expect(events).toEqual(["provision"]);
      expect(getProvisionState(container)?.instances).toEqual([container.get(LifecycleService)]);
    });

    it("provisions in binding order and deprovisions in reverse order", () => {
      const events: Array<string> = [];
      const { LifecycleService: First } = createLifecycleService({
        events,
        methods: ["provision", "deprovision"],
        suffix: "first",
      });
      const { LifecycleService: Second } = createLifecycleService({
        events,
        methods: ["provision", "deprovision"],
        suffix: "second",
      });
      const container: Container = new Container({ bindings: [First, Second] });

      container.provision();
      expect(events).toEqual(["provision-first", "provision-second"]);

      container.deprovision();
      expect(events).toEqual(["provision-first", "provision-second", "deprovision-second", "deprovision-first"]);
    });

    it("throws when provisioning a container that is already provisioned", () => {
      const { LifecycleService, events } = createLifecycleService({ methods: ["provision", "deprovision"] });
      const container: Container = new Container({ bindings: [LifecycleService] });

      container.provision();

      expect(() => container.provision()).toThrow(
        "Container is already provisioned. Deprovision it before provisioning it again."
      );

      // The failed second provision did not re-run the hook.
      expect(events).toEqual(["provision"]);
    });

    it("re-provisions after deprovision and increments the provision id", () => {
      const { LifecycleService } = createLifecycleService({ methods: ["provision", "deprovision"] });
      const container: Container = new Container({ bindings: [LifecycleService] });
      const status: WireStatus = WireStatus.for(container.get(LifecycleService));

      container.provision();
      expect(status.provisionId).toBe(1);
      expect(status.isDeprovisioned).toBe(false);

      container.deprovision();
      expect(status.isDeprovisioned).toBe(true);

      container.provision();
      expect(status.provisionId).toBe(2);
      expect(status.isDeprovisioned).toBe(false);
    });

    it("treats a repeated deprovision as an idempotent no-op", () => {
      const { LifecycleService, events } = createLifecycleService({ methods: ["provision", "deprovision"] });
      const container: Container = new Container({ bindings: [LifecycleService] });

      container.provision();
      container.deprovision();
      container.deprovision();

      expect(events).toEqual(["provision", "deprovision"]);
    });

    it("treats deprovision of a never-provisioned container as a no-op", () => {
      const { LifecycleService, events } = createLifecycleService({ methods: ["provision", "deprovision"] });
      const container: Container = new Container({ bindings: [LifecycleService] });

      container.get(LifecycleService);

      expect(() => container.deprovision()).not.toThrow();
      expect(events).toEqual([]);
      expect(getProvisionState(container)?.instances ?? null).toBeNull();
    });

    it("reflects provider ownership on WireStatus", () => {
      const { LifecycleService } = createLifecycleService({ methods: ["provision", "deprovision"] });
      const container: Container = new Container({ bindings: [LifecycleService] });
      const status: WireStatus = WireStatus.for(container.get(LifecycleService));

      expect(status.isDeprovisioned).toBeNull();

      container.provision();
      expect(status.isDeprovisioned).toBe(false);
      expect(status.isInactive).toBe(false);

      container.deprovision();
      expect(status.isDeprovisioned).toBe(true);
      expect(status.isInactive).toBe(true);
    });
  });

  describe("binding after provision", () => {
    it("throws when binding a provider-lifecycle service onto a provisioned container", () => {
      const { LifecycleService } = createLifecycleService({ methods: ["provision"] });
      const container: Container = new Container();

      container.provision();

      expect(() => container.bind(LifecycleService)).toThrow(
        /already-provisioned container.*would not wire until the next provision cycle/
      );
      expect(() => container.bind(LifecycleService)).toThrow(
        expect.objectContaining({ code: ERROR_CODE_VALIDATION_ERROR })
      );
    });

    it("throws when binding a messaging-handler service onto a provisioned container", () => {
      const handled: Array<boolean> = [];

      @Injectable()
      class ListenerService {
        @OnEvent("SOME_EVENT")
        public onEvent(): void {
          handled.push(true);
        }
      }

      const container: Container = new Container();

      container.provision();

      // Throws even without EventsPlugin: the bind-time guard fires before provision's plugin check.
      expect(() => container.bind(ListenerService)).toThrow(
        expect.objectContaining({ code: ERROR_CODE_VALIDATION_ERROR })
      );
    });

    it("allows binding a plain service onto a provisioned container", () => {
      @Injectable()
      class PlainService {}

      const container: Container = new Container();

      container.provision();

      expect(() => container.bind(PlainService)).not.toThrow();
      expect(container.get(PlainService)).toBeInstanceOf(PlainService);
    });

    it("allows binding a handler service before provision and wires it normally", () => {
      const { LifecycleService, events } = createLifecycleService({ methods: ["provision"] });
      const container: Container = new Container();

      container.bind(LifecycleService);
      container.provision();

      expect(events).toEqual(["provision"]);
    });
  });

  describe("teardown ordering", () => {
    it("runs @OnDeprovision before @OnDeactivation on unbindAll", () => {
      const { LifecycleService, events } = createLifecycleService();
      const container: Container = new Container({ bindings: [LifecycleService] });

      container.provision();
      expect(events).toEqual(["activated", "provision"]);

      container.unbindAll();

      expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
    });

    it("runs @OnDeprovision before @OnDeactivation when a provisioned token is unbound", () => {
      const { LifecycleService, events } = createLifecycleService();
      const container: Container = new Container({ bindings: [LifecycleService] });

      container.provision();
      expect(events).toEqual(["activated", "provision"]);

      container.unbind(LifecycleService);

      expect(events).toEqual(["activated", "provision", "deprovision", "deactivation"]);
    });
  });

  describe("parent and child containers", () => {
    it("provisions only the child's own lifecycle bindings, not the parent's", () => {
      const events: Array<string> = [];
      const { LifecycleService: ParentService } = createLifecycleService({
        events,
        methods: ["provision", "deprovision"],
        suffix: "parent",
      });
      const { LifecycleService: ChildService } = createLifecycleService({
        events,
        methods: ["provision", "deprovision"],
        suffix: "child",
      });
      const parent: Container = new Container({ bindings: [ParentService] });
      const child: Container = new Container({ parent, bindings: [ChildService] });

      child.provision();

      expect(events).toEqual(["provision-child"]);

      child.deprovision();

      expect(events).toEqual(["provision-child", "deprovision-child"]);
    });

    it("owns provision per container, so parent and child are provisioned independently", () => {
      const events: Array<string> = [];
      const { LifecycleService: ParentService } = createLifecycleService({
        events,
        methods: ["provision", "deprovision"],
        suffix: "parent",
      });
      const { LifecycleService: ChildService } = createLifecycleService({
        events,
        methods: ["provision", "deprovision"],
        suffix: "child",
      });
      const parent: Container = new Container({ bindings: [ParentService] });
      const child: Container = new Container({ parent, bindings: [ChildService] });

      parent.provision();
      expect(events).toEqual(["provision-parent"]);

      child.provision();
      expect(events).toEqual(["provision-parent", "provision-child"]);

      parent.deprovision();
      expect(events).toEqual(["provision-parent", "provision-child", "deprovision-parent"]);

      child.deprovision();
      expect(events).toEqual(["provision-parent", "provision-child", "deprovision-parent", "deprovision-child"]);
    });

    it("leaves the parent provisioned when the child is deprovisioned", () => {
      const { LifecycleService: ParentService } = createLifecycleService({
        methods: ["provision", "deprovision"],
        suffix: "parent",
      });
      const { LifecycleService: ChildService } = createLifecycleService({
        methods: ["provision", "deprovision"],
        suffix: "child",
      });
      const parent: Container = new Container({ bindings: [ParentService] });
      const child: Container = new Container({ parent, bindings: [ChildService] });
      const parentStatus: WireStatus = WireStatus.for(parent.get(ParentService));
      const childStatus: WireStatus = WireStatus.for(child.get(ChildService));

      parent.provision();
      child.provision();

      expect(parentStatus.isDeprovisioned).toBe(false);
      expect(childStatus.isDeprovisioned).toBe(false);

      child.deprovision();

      expect(childStatus.isDeprovisioned).toBe(true);
      expect(parentStatus.isDeprovisioned).toBe(false);
    });

    it("does not provision an inherited parent-only binding through the child", () => {
      const events: Array<string> = [];
      const { LifecycleService: ParentService } = createLifecycleService({
        events,
        methods: ["provision", "deprovision"],
        suffix: "parent",
      });
      const parent: Container = new Container({ bindings: [ParentService] });
      const child: Container = new Container({ parent });

      // The child declares no lifecycle binding of its own, so provisioning it is
      // a no-op even though it can resolve the inherited service.
      child.provision();
      expect(events).toEqual([]);
      expect(child.get(ParentService)).toBe(parent.get(ParentService));

      // Provider lifecycle is owned by the container that declares the binding.
      parent.provision();
      expect(events).toEqual(["provision-parent"]);
    });

    it("shares a single parent-owned instance by reference with the child", () => {
      const { LifecycleService } = createLifecycleService({ methods: ["provision", "deprovision"] });
      const parent: Container = new Container({ bindings: [LifecycleService] });
      const child: Container = new Container({ parent });

      expect(child.get(LifecycleService)).toBe(parent.get(LifecycleService));
    });
  });
});
