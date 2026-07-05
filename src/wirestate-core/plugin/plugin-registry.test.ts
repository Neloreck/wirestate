import { ContainerKernel } from "../container/container-kernel";

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

  it("shadows an ancestor plugin whose every kind is claimed by a nearer plugin", () => {
    const kind: symbol = Symbol("KIND");
    const nearer: WirestatePlugin = { handles: [kind] };
    const ancestor: WirestatePlugin = { handles: [kind] };
    const parent: ContainerKernel = new ContainerKernel();
    const child: ContainerKernel = new ContainerKernel(parent);

    setContainerPlugins(parent, [ancestor]);
    setContainerPlugins(child, [nearer]);

    // The nearer plugin owns the kind, so the ancestor's same-kind plugin is dropped.
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

  it("keeps an ancestor plugin that still owns a kind no nearer plugin claims", () => {
    const shared: symbol = Symbol("SHARED");
    const extra: symbol = Symbol("EXTRA");
    const nearer: WirestatePlugin = { handles: [shared] };
    const ancestor: WirestatePlugin = { handles: [shared, extra] };
    const parent: ContainerKernel = new ContainerKernel();
    const child: ContainerKernel = new ContainerKernel(parent);

    setContainerPlugins(parent, [ancestor]);
    setContainerPlugins(child, [nearer]);

    // `shared` is claimed by the nearer plugin, but the ancestor still owns `extra`, so it survives.
    expect(getEffectivePlugins(child)).toEqual([nearer, ancestor]);
  });
});
