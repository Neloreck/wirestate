import { type WirestateVitePlugin, wirestate } from "./vite";

describe("wirestate vite plugin", () => {
  const SERVICE_CODE: string = `
import { Injectable } from "@wirestate/core";

@Injectable()
export class CounterService {}
`;

  /**
   * Creates the plugin with a resolved project root, as Vite does before transforming.
   *
   * @param options - Plugin options to test.
   * @returns Plugin instance ready to transform modules.
   */
  function createPlugin(options?: Parameters<typeof wirestate>[0]): WirestateVitePlugin {
    const plugin: WirestateVitePlugin = wirestate(options);

    plugin.configResolved({ root: "/project" });

    return plugin;
  }

  it("should only apply to the development server", () => {
    expect(wirestate().apply).toBe("serve");
    expect(wirestate().enforce).toBe("pre");
  });

  it("should transform a service module and derive a root relative id", () => {
    const result = createPlugin().transform(SERVICE_CODE, "/project/src/services/counter.ts");

    expect(result?.code).toContain('registerHotModule("src/services/counter.ts", { CounterService })');
  });

  it("should not strip a sibling directory that only shares the root prefix", () => {
    const plugin: WirestateVitePlugin = createPlugin();
    const sibling = plugin.transform(SERVICE_CODE, "/project-other/service.ts");
    const insideRoot = plugin.transform(SERVICE_CODE, "/project/-other/service.ts");

    expect(sibling?.code).toContain('registerHotModule("/project-other/service.ts", { CounterService })');
    expect(insideRoot?.code).toContain('registerHotModule("-other/service.ts", { CounterService })');
  });

  it.each([
    ["global", /\.ts$/g],
    ["sticky", /^\/project\/.*\.ts$/y],
  ])("should apply a %s include expression consistently", (_name, include) => {
    const plugin: WirestateVitePlugin = createPlugin({ include });
    const id: string = "/project/src/services/counter.ts";

    expect(plugin.transform(SERVICE_CODE, id)).not.toBeNull();
    expect(plugin.transform(SERVICE_CODE, id)).not.toBeNull();
  });

  it.each([
    ["global", /\.service\.ts$/g],
    ["sticky", /^\/project\/.*\.service\.ts$/y],
  ])("should apply a %s exclude expression consistently", (_name, exclude) => {
    const plugin: WirestateVitePlugin = createPlugin({ exclude });
    const id: string = "/project/src/counter.service.ts";

    expect(plugin.transform(SERVICE_CODE, id)).toBeNull();
    expect(plugin.transform(SERVICE_CODE, id)).toBeNull();
  });

  it("should skip server transforms", () => {
    const plugin: WirestateVitePlugin = createPlugin();
    const id: string = "/project/src/services/counter.ts";

    expect(plugin.transform(SERVICE_CODE, id, { ssr: true })).toBeNull();
    expect(plugin.transform(SERVICE_CODE, id, { ssr: false })).not.toBeNull();
  });

  it("should skip dependencies, component files, declarations and tests", () => {
    const plugin: WirestateVitePlugin = createPlugin();

    expect(plugin.transform(SERVICE_CODE, "/project/node_modules/pkg/service.ts")).toBeNull();
    expect(plugin.transform(SERVICE_CODE, "/project/src/Counter.tsx")).toBeNull();
    expect(plugin.transform(SERVICE_CODE, "/project/src/types.d.ts")).toBeNull();
    expect(plugin.transform(SERVICE_CODE, "/project/src/counter.test.ts")).toBeNull();
    expect(plugin.transform(SERVICE_CODE, "/project/src/counter.cjs")).toBeNull();
  });

  it("should ignore query suffixes appended by other plugins", () => {
    const result = createPlugin().transform(SERVICE_CODE, "/project/src/counter.ts?t=1712345");

    expect(result?.code).toContain('registerHotModule("src/counter.ts"');
  });

  it("should leave modules without injectable classes untouched", () => {
    expect(createPlugin().transform("export const value = 1;", "/project/src/constants.ts")).toBeNull();
  });
});
