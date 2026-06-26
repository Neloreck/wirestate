import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { OnActivated } from "../../activation/on-activated";
import { OnDeactivation } from "../../activation/on-deactivation";
import { InjectionToken } from "../../binding/binding-tokens";
import { Injectable } from "../../metadata/metadata-injectable";
import { OnDeprovision } from "../../provision/on-deprovision";
import { OnProvision } from "../../provision/on-provision";
import { OnCommand } from "../commands/on-command";
import { OnEvent } from "../events/on-event";

import { normalizeBinding, normalizeInstance, normalizePlugin, normalizeToken } from "./devtools-normalize";

describe("normalizeToken", () => {
  it("classifies the token kind and derives a label", () => {
    class FooService {}

    expect(normalizeToken(FooService)).toEqual({ name: "FooService", kind: "class" });
    expect(normalizeToken("API_URL")).toEqual({ name: "API_URL", kind: "string" });
    expect(normalizeToken(Symbol("SymToken"))).toEqual({ name: "SymToken", kind: "symbol" });
    expect(normalizeToken(new InjectionToken("CONFIG"))).toEqual({
      name: 'InjectionToken "CONFIG"',
      kind: "injectionToken",
    });
  });
});

describe("normalizeBinding", () => {
  class Repository {}

  it("normalizes a value binding - always singleton, no implementation - and stamps the binding id", () => {
    expect(normalizeBinding({ token: "CONFIG", value: 42 }, 5)).toEqual({
      bindingId: 5,
      token: { name: "CONFIG", kind: "string" },
      type: "Value",
      scope: "Singleton",
      implementation: undefined,
    });
  });

  it("normalizes an instance binding, carrying the implementation class name", () => {
    expect(normalizeBinding({ token: Repository, type: "Instance", value: Repository }, 6)).toEqual({
      bindingId: 6,
      token: { name: "Repository", kind: "class" },
      type: "Instance",
      scope: "Singleton",
      implementation: "Repository",
    });
  });

  it("reports a transient instance binding's scope", () => {
    const binding = normalizeBinding({ token: Repository, type: "Instance", value: Repository, scope: "Transient" }, 7);

    expect(binding.scope).toBe("Transient");
  });

  it("normalizes a factory binding - no implementation", () => {
    expect(normalizeBinding({ token: "MAKE", type: "Factory", factory: () => 1 }, 8)).toEqual({
      bindingId: 8,
      token: { name: "MAKE", kind: "string" },
      type: "Factory",
      scope: "Singleton",
      implementation: undefined,
    });
  });
});

describe("normalizePlugin", () => {
  it("reads the plugin class name and maps handled-kind symbols to their descriptions", () => {
    class MessagingPlugin {
      public readonly handles: ReadonlyArray<symbol> = [Symbol("event"), Symbol("command")];
    }

    expect(normalizePlugin(new MessagingPlugin())).toEqual({ name: "MessagingPlugin", handles: ["event", "command"] });
  });

  it("reports no handled kinds for a pure observer plugin", () => {
    class ObserverPlugin {}

    expect(normalizePlugin(new ObserverPlugin())).toEqual({ name: "ObserverPlugin", handles: [] });
  });
});

describe("normalizeInstance", () => {
  it("derives the token and class name, with no status or handlers for an untracked instance", () => {
    class Widget {
      public render(): void {}
    }

    expect(normalizeInstance(new Widget(), 7)).toEqual({
      instanceId: 7,
      token: { name: "Widget", kind: "class" },
      className: "Widget",
      status: undefined,
      handlers: [],
      methods: [{ name: "render", arity: 0 }],
      lifecycle: [],
    });
  });

  it("collects decorated message handlers (command then query then event)", () => {
    @Injectable()
    class Notifier {
      @OnCommand("SAVE")
      public onSave(value: number): number {
        return value;
      }

      @OnEvent("PING")
      public onPing(): void {}

      public plainHelper(): void {}
    }

    const { handlers, methods } = normalizeInstance(new Notifier(), 1);

    expect(handlers).toEqual([
      { channel: "command", type: "SAVE", method: "onSave" },
      { channel: "event", type: "PING", method: "onPing" },
    ]);

    // Handlers are also methods (alongside the plain helper).
    expect(methods.map((method) => method.name)).toEqual(["onSave", "onPing", "plainHelper"]);
  });

  it("enumerates prototype methods with arity across the inheritance chain", () => {
    class Base {
      public baseMethod(value: number): number {
        return value;
      }

      public shadowed(): string {
        return "base";
      }
    }

    class Service extends Base {
      public static staticMethod(): void {}

      // Own properties (set on the instance), not prototype members.
      public field: number = 1;
      public arrowField: () => void = () => {};

      public plain(left: number, right: number): number {
        return left + right;
      }

      // Re-declares Base.shadowed - the derived one wins, listed once.
      public shadowed(): string {
        return "derived";
      }

      // Accessor - never invoked, never listed.
      public get computed(): number {
        return 1;
      }
    }

    const { methods } = normalizeInstance(new Service(), 1);
    const names: Array<string> = methods.map((method) => method.name);

    // Included: own-class methods (most-derived first) then inherited base methods, deduped.
    expect(methods).toEqual([
      { name: "plain", arity: 2 },
      { name: "shadowed", arity: 0 },
      { name: "baseMethod", arity: 1 },
    ]);

    // Excluded: constructor, statics, arrow-field/own-field functions, and accessors.
    expect(names).not.toContain("constructor");
    expect(names).not.toContain("staticMethod");
    expect(names).not.toContain("arrowField");
    expect(names).not.toContain("field");
    expect(names).not.toContain("computed");
  });

  it("returns an empty method list for a plain object instance", () => {
    class Empty {}

    expect(normalizeInstance(new Empty(), 1).methods).toEqual([]);
  });

  it("collects declared lifecycle hooks in setup-to-teardown order, alongside the methods that implement them", () => {
    const { LifecycleService } = createLifecycleService();

    const { lifecycle, methods } = normalizeInstance(new LifecycleService(), 1);

    expect(lifecycle).toEqual([
      { hook: "onActivated", method: "onActivated" },
      { hook: "onProvision", method: "onProvision" },
      { hook: "onDeprovision", method: "onDeprovision" },
      { hook: "onDeactivation", method: "onDeactivation" },
    ]);

    expect(methods.map((method) => method.name)).toEqual([
      "onActivated",
      "onDeactivation",
      "onProvision",
      "onDeprovision",
    ]);
  });

  it("skips a hook whose metadata read throws (hierarchy conflict) without dropping the others", () => {
    @Injectable()
    class Base {
      @OnActivated()
      public onActivated(): void {}

      @OnDeactivation()
      public onDeactivation(): void {}

      @OnDeprovision()
      public onDeprovision(): void {}

      @OnProvision()
      public provisionOnBase(): void {}
    }

    // Re-declares @OnProvision on a different method name across the hierarchy - its reader throws.
    @Injectable()
    class Derived extends Base {
      @OnProvision()
      public provisionOnDerived(): void {}
    }

    expect(() => normalizeInstance(new Derived(), 1)).not.toThrow();

    expect(normalizeInstance(new Derived(), 1).lifecycle).toEqual([
      { hook: "onActivated", method: "onActivated" },
      { hook: "onDeprovision", method: "onDeprovision" },
      { hook: "onDeactivation", method: "onDeactivation" },
    ]);
  });
});
