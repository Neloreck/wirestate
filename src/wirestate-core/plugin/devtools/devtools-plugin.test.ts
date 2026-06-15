import { Container } from "../../container/container";
import { Injectable } from "../../metadata/metadata-injectable";
import { OnProvision } from "../../provision/on-provision";
import { CommandBus } from "../commands/command-bus";
import { CommandsPlugin } from "../commands/commands-plugin";
import { EventBus } from "../events/event-bus";
import { EventsPlugin } from "../events/events-plugin";
import { QueriesPlugin } from "../queries/queries-plugin";
import { QueryBus } from "../queries/query-bus";

import { DEVTOOLS_HOOK_KEY, type DevtoolsHook, getDevtoolsHook } from "./devtools-hook";
import { DevToolsPlugin } from "./devtools-plugin";

describe("DevToolsPlugin", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[DEVTOOLS_HOOK_KEY];
  });

  it("adds nothing to globalThis until a plugin is installed", () => {
    expect(getDevtoolsHook()).toBeUndefined();

    @Injectable()
    class Svc {}

    new Container({ bindings: [Svc], activate: [Svc] });

    expect(getDevtoolsHook()).toBeUndefined();
  });

  it("installs the hook lazily and registers the root with a snapshot", () => {
    @Injectable()
    class Svc {}

    // Held for the test's duration: the plugin observes containers weakly, so an
    // unprovisioned container needs a live reference to stay in the snapshot.
    const container: Container = new Container({ bindings: [Svc], activate: [Svc], plugins: [new DevToolsPlugin()] });

    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;

    expect(hook).toBeDefined();
    expect(hook.protocolVersion).toBe(1);

    const roots = hook.getRoots();

    expect(roots).toHaveLength(1);

    const snapshot = roots[0].snapshot();

    expect(snapshot.containers).toHaveLength(1);
    expect(snapshot.containers[0].bindings.map((binding) => binding.token.name)).toContain("Svc");
    expect(snapshot.containers[0].instances.map((instance) => instance.className)).toContain("Svc");
    expect(container).toBeInstanceOf(Container);
  });

  it("registers many containers as many roots", () => {
    new Container({ plugins: [new DevToolsPlugin()] });
    new Container({ plugins: [new DevToolsPlugin()] });

    expect((getDevtoolsHook() as DevtoolsHook).getRoots()).toHaveLength(2);
  });

  it("streams lifecycle deltas to a subscribed backend", () => {
    @Injectable()
    class Svc {
      @OnProvision()
      public onProvision(): void {}
    }

    const container: Container = new Container({ bindings: [Svc], plugins: [new DevToolsPlugin()] });
    const hook: DevtoolsHook = getDevtoolsHook() as DevtoolsHook;
    const phases: Array<string> = [];

    hook.subscribe((event) => {
      if (event.kind === "lifecycle") {
        phases.push(event.instance ? `${event.phase}:${event.instance.className}` : event.phase);
      }
    });

    container.get(Svc);
    container.provision();
    container.deprovision();

    expect(phases).toContain("activate:Svc");
    expect(phases).toContain("containerProvision");
    expect(phases).toContain("provision:Svc");
    expect(phases).toContain("deprovision:Svc");
    expect(phases).toContain("containerDeprovision");
  });

  it("reconstructs the subtree from inherited observation, linking child to parent", () => {
    @Injectable()
    class ParentSvc {}

    @Injectable()
    class ChildSvc {}

    const parent: Container = new Container({
      bindings: [ParentSvc],
      activate: [ParentSvc],
      plugins: [new DevToolsPlugin()],
    });

    const child: Container = new Container({ parent, bindings: [ChildSvc], activate: [ChildSvc] });

    const snapshot = (getDevtoolsHook() as DevtoolsHook).getRoots()[0].snapshot();

    expect(snapshot.containers).toHaveLength(2);

    const classNames: Array<string> = snapshot.containers.flatMap((container) =>
      container.instances.map((instance) => instance.className)
    );

    expect(classNames).toContain("ParentSvc");
    expect(classNames).toContain("ChildSvc");

    const parentSnapshot = snapshot.containers.find((container) =>
      container.instances.some((instance) => instance.className === "ParentSvc")
    );
    const childSnapshot = snapshot.containers.find((container) =>
      container.instances.some((instance) => instance.className === "ChildSvc")
    );

    expect(childSnapshot?.parentContainerId).toBe(parentSnapshot?.containerId);
    expect(parentSnapshot?.parentContainerId).toBeNull();
    expect([parent, child].every((it) => it instanceof Container)).toBe(true);
  });

  it("normalizes binding type and scope in the snapshot", () => {
    @Injectable()
    class Svc {}

    const TOKEN: symbol = Symbol("CONFIG");

    const container: Container = new Container({
      bindings: [Svc, { token: TOKEN, value: 42 }],
      activate: [Svc],
      plugins: [new DevToolsPlugin()],
    });

    const snapshot = (getDevtoolsHook() as DevtoolsHook).getRoots()[0].snapshot();
    const bindings = snapshot.containers[0].bindings;

    const instanceBinding = bindings.find((binding) => binding.token.name === "Svc");
    const valueBinding = bindings.find((binding) => binding.token.name === "CONFIG");

    expect(instanceBinding).toMatchObject({ type: "Instance", scope: "Singleton", implementation: "Svc" });
    expect(valueBinding).toMatchObject({ type: "Value", scope: "Singleton", token: { kind: "symbol" } });
    expect(container).toBeInstanceOf(Container);
  });

  it("snapshots the own plugins registered on a container", () => {
    const container: Container = new Container({ plugins: [new EventsPlugin(), new DevToolsPlugin()] });

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
    // provision (not install), by which point every bus is bound — so order is irrelevant.
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
});
