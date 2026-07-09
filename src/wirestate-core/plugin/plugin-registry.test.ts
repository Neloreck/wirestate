import { ContainerKernel } from "../container/container-kernel";

import { CommandsPlugin } from "./commands/commands-plugin";
import { EventsPlugin } from "./events/events-plugin";
import { EVENT_REGISTRATION } from "./events/on-event";
import { type WirestatePlugin } from "./plugin";
import { getEffectivePlugins, setContainerPlugins } from "./plugin-registry";

describe("getEffectivePlugins", () => {
  it("returns plugins across the parent chain, nearest container first", () => {
    const ancestorPlugin: WirestatePlugin = {};
    const nearerPlugin: WirestatePlugin = {};
    const parent: ContainerKernel = new ContainerKernel();
    const child: ContainerKernel = new ContainerKernel(parent);

    setContainerPlugins(parent, [ancestorPlugin]);
    setContainerPlugins(child, [nearerPlugin]);

    expect(getEffectivePlugins(child)).toEqual([nearerPlugin, ancestorPlugin]);
  });

  it("includes the same plugin instance only once when it is shared across the chain", () => {
    const shared: WirestatePlugin = {};
    const parent: ContainerKernel = new ContainerKernel();
    const child: ContainerKernel = new ContainerKernel(parent);

    setContainerPlugins(parent, [shared]);
    setContainerPlugins(child, [shared]);

    expect(getEffectivePlugins(child)).toEqual([shared]);
  });

  it("shadows an ancestor built-in messaging plugin with the same kind", () => {
    const nearer: EventsPlugin = new EventsPlugin();
    const ancestor: EventsPlugin = new EventsPlugin();
    const parent: ContainerKernel = new ContainerKernel();
    const child: ContainerKernel = new ContainerKernel(parent);

    setContainerPlugins(parent, [ancestor]);
    setContainerPlugins(child, [nearer]);

    // The nearer built-in plugin owns the kind, so the ancestor's same-kind plugin is dropped.
    expect(getEffectivePlugins(child)).toEqual([nearer]);
    // From the ancestor's own perspective there is nothing nearer to shadow it.
    expect(getEffectivePlugins(parent)).toEqual([ancestor]);
  });

  it("memoizes the effective set per container and invalidates it when plugins are re-set", () => {
    const first: WirestatePlugin = {};
    const second: WirestatePlugin = {};
    const container: ContainerKernel = new ContainerKernel();

    setContainerPlugins(container, [first]);

    const initial: ReadonlyArray<WirestatePlugin> = getEffectivePlugins(container);

    // Repeated calls reuse the memoized array (same reference, no re-allocation).
    expect(getEffectivePlugins(container)).toBe(initial);

    // Re-setting the container's plugins invalidates the memo and reflects the new set.
    setContainerPlugins(container, [second]);

    expect(getEffectivePlugins(container)).toEqual([second]);
    expect(getEffectivePlugins(container)).not.toBe(initial);
  });

  it("keeps an ancestor built-in messaging plugin for a different kind", () => {
    const nearer: EventsPlugin = new EventsPlugin();
    const ancestor: CommandsPlugin = new CommandsPlugin();
    const parent: ContainerKernel = new ContainerKernel();
    const child: ContainerKernel = new ContainerKernel(parent);

    setContainerPlugins(parent, [ancestor]);
    setContainerPlugins(child, [nearer]);

    // The plugins own different built-in kinds, so both survive.
    expect(getEffectivePlugins(child)).toEqual([nearer, ancestor]);
  });

  it("does not let a custom plugin claim a built-in messaging kind", () => {
    const customPlugin: WirestatePlugin = {};
    const ancestor: EventsPlugin = new EventsPlugin();
    const parent: ContainerKernel = new ContainerKernel();
    const child: ContainerKernel = new ContainerKernel(parent);

    // Untyped callers can still add arbitrary properties, but they do not participate in internal kind ownership.
    Object.assign(customPlugin, { handles: [EVENT_REGISTRATION.kind] });
    setContainerPlugins(parent, [ancestor]);
    setContainerPlugins(child, [customPlugin]);

    expect(getEffectivePlugins(child)).toEqual([customPlugin, ancestor]);
  });

  it("does not expose handled kinds through the public plugin contract", () => {
    const hasHandles: "handles" extends keyof WirestatePlugin ? true : false = false;

    expect(hasHandles).toBe(false);
  });
});
