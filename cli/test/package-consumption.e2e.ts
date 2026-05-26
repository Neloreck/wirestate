import * as fs from "node:fs";
import path from "node:path";

import {
  STAGED_PACKAGES,
  packageBinPath,
  packageExportCheckScript,
  prepareConsumerFixture,
  readConsumerText,
  run,
  writeConsumerText,
  writeTsConfig,
  CONSUMER_ROOT,
} from "./package-consumption.utils";

describe("built package consumption", () => {
  beforeAll(() => {
    prepareConsumerFixture();
  });

  it("marks ESM and CJS build trees with explicit package formats", () => {
    for (const pkg of STAGED_PACKAGES) {
      expect(readConsumerText("node_modules", pkg.name, "esm", "package.json")).toBe('{\n  "type": "module"\n}\n');
      expect(readConsumerText("node_modules", pkg.name, "cjs", "package.json")).toBe('{\n  "type": "commonjs"\n}\n');
    }
  });

  it("loads package exports through CommonJS require", () => {
    writeConsumerText("require-consumer.cjs", packageExportCheckScript("require"));

    run(process.execPath, ["require-consumer.cjs"]);
    run(process.execPath, ["--conditions=production", "require-consumer.cjs"]);
  });

  it("loads package exports through native ESM import without typeless package warnings", () => {
    const script = packageExportCheckScript("import");
    const result = run(process.execPath, ["--input-type=module", "--eval", script]);
    const productionResult = run(process.execPath, [
      "--conditions=production",
      "--input-type=module",
      "--eval",
      script,
    ]);

    expect(result.stderr).toBe("");
    expect(productionResult.stderr).toBe("");
  });

  it("bundles package imports with Vite", () => {
    run(process.execPath, [
      packageBinPath("vite", "bin/vite.js"),
      "build",
      "--config",
      "vite.config.mjs",
      "--clearScreen",
      "false",
    ]);

    expect(fs.existsSync(path.resolve(CONSUMER_ROOT, "dist", "wirestate-consumer.js"))).toBe(true);
  });

  it("resolves package types with TypeScript bundler module resolution", () => {
    writeTsConfig("tsconfig.bundler.json", "esnext", "bundler");

    run(process.execPath, [
      packageBinPath("typescript", "bin/tsc"),
      "-p",
      "tsconfig.bundler.json",
      "--pretty",
      "false",
    ]);
  });

  it("resolves package types with TypeScript Node16 module resolution", () => {
    writeTsConfig("tsconfig.node16.json", "Node16", "Node16");

    run(process.execPath, [packageBinPath("typescript", "bin/tsc"), "-p", "tsconfig.node16.json", "--pretty", "false"]);
  });
});
