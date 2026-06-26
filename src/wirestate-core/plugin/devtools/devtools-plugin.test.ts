import { Container } from "../../container/container";
import { Injectable } from "../../metadata/metadata-injectable";
import { OnProvision } from "../../provision/on-provision";
import { CommandBus } from "../commands/command-bus";
import { CommandsPlugin } from "../commands/commands-plugin";
import { OnCommand } from "../commands/on-command";
import { EventBus } from "../events/event-bus";
import { EventsPlugin } from "../events/events-plugin";
import { OnEvent } from "../events/on-event";
import { OnQuery } from "../queries/on-query";
import { QueriesPlugin } from "../queries/queries-plugin";
import { QueryBus } from "../queries/query-bus";

import { DEVTOOLS_HOOK_KEY, getDevtoolsHook } from "./devtools-hook";
import { type DevtoolsHook } from "./devtools-hook.types";
import { DevToolsPlugin } from "./devtools-plugin";

@Injectable()
class Service {}

describe("DevToolsPlugin", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[DEVTOOLS_HOOK_KEY];
  });

  it("adds nothing to globalThis until a plugin is installed", () => {
    expect(getDevtoolsHook()).toBeUndefined();

    new Container({ bindings: [Service], activate: [Service] });

    expect(getDevtoolsHook()).toBeUndefined();
  });

  it("installs the hook lazily and registers the root with a snapshot", () => {
    const container: Container = new Container({
      bindings: [Service],
      activate: [Service],
      plugins: [new DevToolsPlugin()],
    });

    // The tree tracks provisioned (live) containers, so provision before snapshotting.
    container.provision();

    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;

    expect(hook).toBeDefined();
    expect(hook.protocolVersion).toBe(1);

    const roots = hook.getRoots();

    expect(roots).toHaveLength(1);

    const snapshot = roots[0].snapshot();

    expect(snapshot.containers).toHaveLength(1);
    expect(snapshot.containers[0].bindings.map((binding) => binding.token.name)).toContain("Service");
    expect(snapshot.containers[0].instances.map((instance) => instance.className)).toContain("Service");
    expect(container).toBeInstanceOf(Container);
  });

  it("registers many containers as many roots", () => {
    new Container({ plugins: [new DevToolsPlugin()] });
    new Container({ plugins: [new DevToolsPlugin()] });

    expect((getDevtoolsHook() as DevtoolsHook).getRoots()).toHaveLength(2);
  });

  it("registers one root and tracks only the live container when a plugin instance is installed twice", () => {
    // A managed provider reuses one config (and its plugin instance) for a StrictMode
    // throwaway plus the committed container; only the committed one provisions.
    const plugin: DevToolsPlugin = new DevToolsPlugin();

    new Container({ bindings: [Service], plugins: [plugin] }); // throwaway - never provisioned

    const committed: Container = new Container({ bindings: [Service], plugins: [plugin] });

    committed.provision();

    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;

    // One root, not one per install; and only the provisioned container is in the tree.
    expect(hook.getRoots()).toHaveLength(1);
    expect(hook.getRoots()[0].snapshot().containers).toHaveLength(1);

    committed.deprovision();
  });

  it("deregisters its root once the last container deprovisions, leaving no empty shell", () => {
    const container: Container = new Container({ bindings: [Service], plugins: [new DevToolsPlugin()] });
    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;

    container.provision();

    expect(hook.getRoots()).toHaveLength(1);

    container.deprovision();

    expect(hook.getRoots()).toHaveLength(0);
  });

  it("keeps the root until its last observed container deprovisions", () => {
    @Injectable()
    class ParentService {}

    @Injectable()
    class ChildService {}

    const parent: Container = new Container({ bindings: [ParentService], plugins: [new DevToolsPlugin()] });
    const child: Container = new Container({ parent, bindings: [ChildService] });
    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;

    parent.provision();
    child.provision();

    expect(hook.getRoots()).toHaveLength(1);

    // The child (observed through inheritance) leaves first; the parent keeps the root alive.
    child.deprovision();
    expect(hook.getRoots()).toHaveLength(1);

    // The last container leaves -> the root is released.
    parent.deprovision();
    expect(hook.getRoots()).toHaveLength(0);
  });

  it("re-registers under a fresh, higher id when a container provisions after going empty", () => {
    const container: Container = new Container({ bindings: [Service], plugins: [new DevToolsPlugin()] });
    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;

    container.provision();

    const firstId: number = hook.getRoots()[0].rootId;

    container.deprovision();
    expect(hook.getRoots()).toHaveLength(0);

    container.provision();

    const roots = hook.getRoots();

    expect(roots).toHaveLength(1);
    // Ids are never reused: the re-registered root takes the next id up.
    expect(roots[0].rootId).toBeGreaterThan(firstId);

    container.deprovision();
  });

  it("streams lifecycle deltas to a subscribed backend", () => {
    @Injectable()
    class LifecycleService {
      @OnProvision()
      public onProvision(): void {}
    }

    const container: Container = new Container({
      bindings: [LifecycleService],
      plugins: [new DevToolsPlugin()],
    });
    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;
    const phases: Array<string> = [];

    hook.subscribe((event) => {
      if (event.kind === "lifecycle") {
        phases.push(event.instance ? `${event.phase}:${event.instance.className}` : event.phase);
      }
    });

    container.get(LifecycleService);
    container.provision();
    container.deprovision();

    expect(phases).toContain("activate:LifecycleService");
    expect(phases).toContain("containerProvision");
    expect(phases).toContain("provision:LifecycleService");
    expect(phases).toContain("deprovision:LifecycleService");
    expect(phases).toContain("containerDeprovision");
  });

  it("stamps a stable instanceId on snapshots that matches its lifecycle deltas", () => {
    @Injectable()
    class LifecycleService {
      @OnProvision()
      public onProvision(): void {}
    }

    const container: Container = new Container({ bindings: [LifecycleService], plugins: [new DevToolsPlugin()] });
    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;
    const provisionIds: Array<number> = [];

    hook.subscribe((event) => {
      if (event.kind === "lifecycle" && event.phase === "provision" && event.instance) {
        provisionIds.push(event.instance.instanceId);
      }
    });

    container.get(LifecycleService);
    container.provision();

    const instance = hook
      .getRoots()[0]
      .snapshot()
      .containers[0].instances.find((entry) => entry.className === "LifecycleService");

    expect(instance?.instanceId).toEqual(expect.any(Number));
    // The provision delta carries the same id as the snapshot - exact correlation, not by class name.
    expect(provisionIds).toContain(instance?.instanceId);

    // The id is stable across snapshots.
    const again = hook
      .getRoots()[0]
      .snapshot()
      .containers[0].instances.find((entry) => entry.className === "LifecycleService");

    expect(again?.instanceId).toBe(instance?.instanceId);

    container.deprovision();
  });

  it("stamps timestamps on lifecycle/registration deltas and carries a configured root label", () => {
    @Injectable()
    class CommandService {
      @OnCommand("SAVE")
      public save(): void {}
    }

    const container: Container = new Container({
      bindings: [CommandService],
      plugins: [new CommandsPlugin(), new DevToolsPlugin({ label: "main" })],
    });
    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;
    const stamped: Array<boolean> = [];

    hook.subscribe((event) => {
      if (event.kind === "lifecycle" || event.kind === "registration") {
        stamped.push(typeof event.timestamp === "number");
      }
    });

    container.provision();

    expect(stamped.length).toBeGreaterThan(0);
    expect(stamped.every(Boolean)).toBe(true);
    expect(hook.getRoots()[0].snapshot().label).toBe("main");

    container.deprovision();
  });

  it("reads a live instance value on demand via inspect, safely", () => {
    @Injectable()
    class CounterService {
      public count: number = 5;
      public nested: { deep: { value: string } } = { deep: { value: "x" } };
    }

    const container: Container = new Container({
      bindings: [CounterService],
      activate: [CounterService],
      plugins: [new DevToolsPlugin()],
    });

    container.provision();

    const root = (getDevtoolsHook() as DevtoolsHook).getRoots()[0];
    const counter = root.snapshot().containers[0].instances.find((entry) => entry.className === "CounterService");
    const id: number = counter?.instanceId as number;

    expect(root.inspect(id, ["count"])).toBe(5);
    expect(root.inspect(id, ["nested", "deep", "value"])).toBe("x");
    // Unknown instance / missing path -> undefined, never throws.
    expect(root.inspect(999_999, ["count"])).toBeUndefined();
    expect(root.inspect(id, ["nope", "deeper"])).toBeUndefined();

    container.deprovision();
  });

  it("reads a live Value binding on demand via inspectBinding, by stable binding id", () => {
    const TOKEN: symbol = Symbol("CONFIG");
    const config = { url: "https://api.example.com", nested: { retries: 3 } };

    const container: Container = new Container({
      bindings: [{ token: TOKEN, value: config }],
      plugins: [new DevToolsPlugin()],
    });

    container.provision();

    const root = (getDevtoolsHook() as DevtoolsHook).getRoots()[0];
    const binding = root.snapshot().containers[0].bindings.find((entry) => entry.token.name === "CONFIG");
    const id: number = binding?.bindingId as number;

    expect(id).toEqual(expect.any(Number));
    // The whole value at the root path, then nested reads.
    expect(root.inspectBinding(id, [])).toBe(config);
    expect(root.inspectBinding(id, ["url"])).toBe("https://api.example.com");
    expect(root.inspectBinding(id, ["nested", "retries"])).toBe(3);
    // Unknown id / missing path -> undefined, never throws.
    expect(root.inspectBinding(999_999, [])).toBeUndefined();
    expect(root.inspectBinding(id, ["nope", "deeper"])).toBeUndefined();

    // The id is stable across snapshots.
    const again = root.snapshot().containers[0].bindings.find((entry) => entry.token.name === "CONFIG");

    expect(again?.bindingId).toBe(id);

    container.deprovision();
  });

  it("does not expose Instance or Factory bindings to inspectBinding", () => {
    @Injectable()
    class ValueService {
      public secret: number = 1;
    }

    const container: Container = new Container({
      bindings: [ValueService, { token: "MAKE", type: "Factory", factory: () => ({ made: true }) }],
      activate: [ValueService],
      plugins: [new DevToolsPlugin()],
    });

    container.provision();

    const root = (getDevtoolsHook() as DevtoolsHook).getRoots()[0];
    const bindings = root.snapshot().containers[0].bindings;
    const instanceId: number = bindings.find((binding) => binding.token.name === "ValueService")?.bindingId as number;
    const factoryId: number = bindings.find((binding) => binding.token.name === "MAKE")?.bindingId as number;

    // A non-Value binding id never matches: Instance values are read via `inspect`, and a Factory is
    // never invoked (reading it would be a side effect).
    expect(root.inspectBinding(instanceId, [])).toBeUndefined();
    expect(root.inspectBinding(factoryId, [])).toBeUndefined();

    container.deprovision();
  });

  it("captures command/query results, correlated to their dispatch", async () => {
    const container: Container = new Container({
      plugins: [new CommandsPlugin(), new QueriesPlugin(), new DevToolsPlugin()],
    });

    container.provision();

    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;
    const ids: Map<string, number> = new Map();
    const results: Array<{ messageId: number; outcome: string; value: unknown }> = [];

    hook.subscribe((event) => {
      if (event.kind === "message") {
        ids.set(event.message.type, event.message.id);
      } else if (event.kind === "messageResult") {
        results.push({ messageId: event.messageId, outcome: event.outcome, value: event.value });
      }
    });

    container.get(CommandBus).register("SAVE", () => "saved");
    container.get(QueryBus).register("SLOW", () => Promise.resolve(42));

    container.get(CommandBus).execute("SAVE");
    await container.get(QueryBus).query("SLOW");
    // Flush the async result observer (a microtask attached to the resolved promise).
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(results.find((entry) => entry.messageId === ids.get("SAVE"))).toMatchObject({
      outcome: "resolved",
      value: "saved",
    });
    expect(results.find((entry) => entry.messageId === ids.get("SLOW"))).toMatchObject({
      outcome: "resolved",
      value: 42,
    });

    container.deprovision();
  });

  it("identifies a tracked service instance by identity via serviceRefOf", () => {
    @Injectable()
    class LoggingService {}

    const container: Container = new Container({
      bindings: [LoggingService],
      activate: [LoggingService],
      plugins: [new DevToolsPlugin()],
    });

    container.provision();

    const root = (getDevtoolsHook() as DevtoolsHook).getRoots()[0];
    const logger: LoggingService = container.get(LoggingService);

    expect(root.serviceRefOf(logger)?.className).toBe("LoggingService");
    expect(root.serviceRefOf(logger)?.instanceId).toEqual(expect.any(Number));
    // A plain object (or any value the container doesn't manage) is not a service.
    expect(root.serviceRefOf({ not: "a service" })).toBeUndefined();

    container.deprovision();
  });

  it("reconstructs the subtree from inherited observation, linking child to parent", () => {
    @Injectable()
    class ParentService {}

    @Injectable()
    class ChildService {}

    const parent: Container = new Container({
      bindings: [ParentService],
      activate: [ParentService],
      plugins: [new DevToolsPlugin()],
    });

    const child: Container = new Container({ parent, bindings: [ChildService], activate: [ChildService] });

    parent.provision();
    child.provision();

    const snapshot = (getDevtoolsHook() as DevtoolsHook).getRoots()[0].snapshot();

    expect(snapshot.containers).toHaveLength(2);

    const classNames: Array<string> = snapshot.containers.flatMap((container) =>
      container.instances.map((instance) => instance.className)
    );

    expect(classNames).toContain("ParentService");
    expect(classNames).toContain("ChildService");

    const parentSnapshot = snapshot.containers.find((container) =>
      container.instances.some((instance) => instance.className === "ParentService")
    );
    const childSnapshot = snapshot.containers.find((container) =>
      container.instances.some((instance) => instance.className === "ChildService")
    );

    expect(childSnapshot?.parentContainerId).toBe(parentSnapshot?.containerId);
    expect(parentSnapshot?.parentContainerId).toBeNull();
    expect([parent, child].every((it) => it instanceof Container)).toBe(true);
  });

  it("normalizes binding type and scope in the snapshot", () => {
    const TOKEN: symbol = Symbol("CONFIG");

    const container: Container = new Container({
      bindings: [Service, { token: TOKEN, value: 42 }],
      activate: [Service],
      plugins: [new DevToolsPlugin()],
    });

    container.provision();

    const snapshot = (getDevtoolsHook() as DevtoolsHook).getRoots()[0].snapshot();
    const bindings = snapshot.containers[0].bindings;

    const instanceBinding = bindings.find((binding) => binding.token.name === "Service");
    const valueBinding = bindings.find((binding) => binding.token.name === "CONFIG");

    expect(instanceBinding).toMatchObject({ type: "Instance", scope: "Singleton", implementation: "Service" });
    expect(valueBinding).toMatchObject({ type: "Value", scope: "Singleton", token: { kind: "symbol" } });
    expect(container).toBeInstanceOf(Container);
  });

  it("snapshots the own plugins registered on a container", () => {
    const container: Container = new Container({ plugins: [new EventsPlugin(), new DevToolsPlugin()] });

    container.provision();

    const snapshot = (getDevtoolsHook() as DevtoolsHook).getRoots()[0].snapshot();
    const plugins = snapshot.containers[0].plugins;
    const names: Array<string> = plugins.map((plugin) => plugin.name);

    expect(names).toContain("EventsPlugin");
    expect(names).toContain("DevToolsPlugin");
    // A messaging plugin declares the kind it owns; a pure observer declares none.
    expect(plugins.find((plugin) => plugin.name === "EventsPlugin")?.handles.length).toBeGreaterThan(0);
    expect(plugins.find((plugin) => plugin.name === "DevToolsPlugin")?.handles).toEqual([]);
    expect(container).toBeInstanceOf(Container);
  });

  it("streams messaging traffic across events, commands, and queries", () => {
    const container: Container = new Container({
      plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin(), new DevToolsPlugin()],
    });

    // Provision taps the buses; subscribe afterwards, before any dispatch.
    container.provision();

    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;
    const messages: Array<{ channel: string; type: string; payload: unknown }> = [];

    hook.subscribe((event) => {
      if (event.kind === "message") {
        messages.push({ channel: event.message.channel, type: event.message.type, payload: event.message.payload });
      }
    });

    container.get(CommandBus).register("SAVE", () => "saved");
    container.get(QueryBus).register("FIND", () => 42);
    container.get(EventBus).emit("PING", { n: 1 });
    container.get(CommandBus).execute("SAVE", { id: 7 });
    container.get(QueryBus).query("FIND");

    expect(messages.map((message) => `${message.channel}:${message.type}`)).toEqual(
      expect.arrayContaining(["event:PING", "command:SAVE", "query:FIND"])
    );
    expect(messages.find((message) => message.type === "PING")?.payload).toEqual({ n: 1 });

    container.deprovision();
  });

  it("observes messaging regardless of plugin registration order", () => {
    // DevToolsPlugin is registered BEFORE the messaging plugins. The tap happens at
    // provision (not install), by which point every bus is bound - so order is irrelevant.
    const container: Container = new Container({
      plugins: [new DevToolsPlugin(), new EventsPlugin(), new CommandsPlugin()],
    });

    container.provision();

    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;
    const seen: Array<string> = [];

    hook.subscribe((event) => {
      if (event.kind === "message") {
        seen.push(`${event.message.channel}:${event.message.type}`);
      }
    });

    container.get(CommandBus).register("DO", () => undefined);
    container.get(EventBus).emit("TICK");
    container.get(CommandBus).execute("DO");

    expect(seen).toEqual(expect.arrayContaining(["event:TICK", "command:DO"]));

    container.deprovision();
  });

  it("snapshots declared message handlers on an instance", () => {
    @Injectable()
    class Feature {
      @OnCommand("SAVE")
      public save(): void {}

      @OnQuery("FIND")
      public find(): number {
        return 1;
      }

      @OnEvent("PING")
      public onPing(): void {}
    }

    const container: Container = new Container({
      bindings: [Feature],
      plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin(), new DevToolsPlugin()],
    });

    // Provision force-activates the handler-bearing service and wires its handlers.
    container.provision();

    const snapshot = (getDevtoolsHook() as DevtoolsHook).getRoots()[0].snapshot();
    const feature = snapshot.containers
      .flatMap((entry) => entry.instances)
      .find((instance) => instance.className === "Feature");

    const handlers: Array<string> = (feature?.handlers ?? []).map((handler) => `${handler.channel}:${handler.type}`);

    expect(handlers).toEqual(expect.arrayContaining(["command:SAVE", "query:FIND", "event:PING"]));

    container.deprovision();
  });

  it("streams handler registration and unregistration deltas (decorated and imperative)", () => {
    @Injectable()
    class ServiceWithCommand {
      @OnCommand("SAVE")
      public save(): void {}
    }

    const container: Container = new Container({
      bindings: [ServiceWithCommand],
      plugins: [new CommandsPlugin(), new DevToolsPlugin()],
    });

    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;
    const registrations: Array<string> = [];

    // Subscribe before provision so the decorated handler's wiring is observed.
    hook.subscribe((event) => {
      if (event.kind === "registration") {
        registrations.push(`${event.registration.phase}:${event.registration.channel}:${event.registration.type}`);
      }
    });

    // Provision wires the decorated @OnCommand handler through the (now-tapped) register.
    container.provision();

    // An imperative registration is observed live too.
    const unregister = container.get(CommandBus).register("MANUAL", () => undefined);

    unregister();

    container.deprovision();

    expect(registrations).toContain("registered:command:SAVE");
    expect(registrations).toContain("registered:command:MANUAL");
    expect(registrations).toContain("unregistered:command:MANUAL");
    expect(registrations).toContain("unregistered:command:SAVE");
  });

  it("streams deactivation on unbindAll and drops the instance from the snapshot", () => {
    @Injectable()
    class LifecycleService {
      @OnProvision()
      public onProvision(): void {}
    }

    const container: Container = new Container({ bindings: [LifecycleService], plugins: [new DevToolsPlugin()] });
    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;

    container.get(LifecycleService);
    container.provision();

    // The instance is present before teardown.
    expect(
      hook
        .getRoots()[0]
        .snapshot()
        .containers[0].instances.map((instance) => instance.className)
    ).toContain("LifecycleService");

    const phases: Array<string> = [];

    hook.subscribe((event) => {
      if (event.kind === "lifecycle" && event.instance) {
        phases.push(`${event.phase}:${event.instance.className}`);
      }
    });

    container.unbindAll();

    expect(phases).toContain("deprovision:LifecycleService");
    expect(phases).toContain("deactivate:LifecycleService");

    // Cleanup is reflected: deprovisioning the last container releases the root entirely, so the
    // torn-down instance can no longer surface through a lingering empty root.
    expect(hook.getRoots()).toHaveLength(0);
  });

  it("taps a bus exactly once across provision cycles (no double observation)", () => {
    const container: Container = new Container({ plugins: [new EventsPlugin(), new DevToolsPlugin()] });

    // Provision/deprovision/provision: the bus must be tapped once, not once per cycle.
    container.provision();
    container.deprovision();
    container.provision();

    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;
    let pings: number = 0;

    hook.subscribe((event) => {
      if (event.kind === "message" && event.message.type === "PING") {
        pings += 1;
      }
    });

    container.get(EventBus).emit("PING");

    expect(pings).toBe(1);

    container.deprovision();
  });
});
