import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const PROJECT_ROOT: string = path.resolve(__dirname, "../..");
const STAGED_PACKAGES_ROOT: string = path.resolve(PROJECT_ROOT, "target/pkg");

export const CONSUMER_ROOT: string = path.resolve(PROJECT_ROOT, "target/pkg-consumption-test");

type PackageExportCheckMode = "import" | "require";

export interface PackageCheckDescriptor {
  readonly exportName: string;
  readonly name: string;
}

export interface StagedPackageDescriptor {
  readonly directory: string;
  readonly name: string;
}

interface CommandResultDescriptor {
  readonly stderr: string;
  readonly stdout: string;
}

export const STAGED_PACKAGES: Array<StagedPackageDescriptor> = [
  { directory: "wirestate-core", name: "@wirestate/core" },
  { directory: "wirestate-react", name: "@wirestate/react" },
  { directory: "wirestate-react-mobx", name: "@wirestate/react-mobx" },
  { directory: "wirestate-react-signals", name: "@wirestate/react-signals" },
  { directory: "wirestate-lit", name: "@wirestate/lit" },
  { directory: "wirestate-lit-signals", name: "@wirestate/lit-signals" },
  { directory: "wirestate", name: "wirestate" },
];

export const PACKAGE_CHECKS: Array<PackageCheckDescriptor> = [
  { exportName: "createContainer", name: "@wirestate/core" },
  { exportName: "ContainerProvider", name: "@wirestate/react" },
  { exportName: "Action", name: "@wirestate/react-mobx" },
  { exportName: "signal", name: "@wirestate/react-signals" },
  { exportName: "ContainerProvider", name: "@wirestate/lit" },
  { exportName: "signal", name: "@wirestate/lit-signals" },
  { exportName: "createContainer", name: "wirestate" },
  { exportName: "Action", name: "wirestate/mobx" },
  { exportName: "signal", name: "wirestate/signals" },
  { exportName: "mockContainer", name: "wirestate/test-utils" },
];

function writeJson(filePath: string, value: Record<string, unknown>): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function readConsumerText(...segments: Array<string>): string {
  return fs.readFileSync(path.resolve(CONSUMER_ROOT, ...segments), "utf8");
}

export function writeConsumerText(relativePath: string, value: string): void {
  fs.writeFileSync(path.resolve(CONSUMER_ROOT, relativePath), value);
}

export function packageBinPath(packageName: string, binPath: string): string {
  const directBinPath = path.resolve(PROJECT_ROOT, "node_modules", packageName, binPath);

  if (fs.existsSync(directBinPath)) {
    return directBinPath;
  }

  const pnpmRoot = path.resolve(PROJECT_ROOT, "node_modules", ".pnpm");
  const packageDir = fs.readdirSync(pnpmRoot).find((entry) => entry.startsWith(`${packageName}@`));

  if (!packageDir) {
    throw new Error(`Could not find ${packageName} in ${pnpmRoot}`);
  }

  return path.resolve(pnpmRoot, packageDir, "node_modules", packageName, binPath);
}

export function packageExportCheckScript(mode: PackageExportCheckMode): string {
  return [
    `const checks = ${JSON.stringify(PACKAGE_CHECKS)};`,
    "for (const check of checks) {",
    `  const mod = ${mode === "require" ? "require(check.name)" : "await import(check.name)"};`,
    "  if (typeof mod[check.exportName] === 'undefined') {",
    `    throw new Error(\`\${check.name} did not expose \${check.exportName} through ${mode}\`);`,
    "  }",
    "}",
    "",
  ].join("\n");
}

export function prepareConsumerFixture(): void {
  fs.rmSync(CONSUMER_ROOT, { force: true, recursive: true });
  fs.mkdirSync(path.resolve(CONSUMER_ROOT, "node_modules", "@wirestate"), { recursive: true });
  fs.mkdirSync(path.resolve(CONSUMER_ROOT, "src"), { recursive: true });

  writeJson(path.resolve(CONSUMER_ROOT, "package.json"), {
    name: "wirestate-package-consumer",
    private: true,
    type: "module",
  });

  for (const pkg of STAGED_PACKAGES) {
    copyStagedPackage(pkg);
  }

  writeConsumerText("src/vite-entry.ts", viteEntrySource());
  writeConsumerText("src/types.ts", typecheckSource());
  writeConsumerText("vite.config.mjs", viteConfigSource());
}

export function writeTsConfig(fileName: string, module: string, moduleResolution: string): void {
  writeJson(path.resolve(CONSUMER_ROOT, fileName), {
    compilerOptions: {
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      experimentalDecorators: true,
      jsx: "react-jsx",
      lib: ["es2022", "dom"],
      module,
      moduleResolution,
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      target: "es2022",
      types: [],
    },
    include: ["src/types.ts"],
  });
}

function typecheckSource(): string {
  return [
    'import { createContainer, type ContainerConfig } from "@wirestate/core";',
    'import { ContainerProvider as LitContainerProvider } from "@wirestate/lit";',
    'import { signal as litSignal } from "@wirestate/lit-signals";',
    'import type { WatchDirectiveFunction } from "@wirestate/lit-signals";',
    'import { ContainerProvider as ReactContainerProvider } from "@wirestate/react";',
    'import { Action } from "@wirestate/react-mobx";',
    'import type { AnnotationMapEntry, IActionFactory } from "@wirestate/react-mobx";',
    'import { signal as reactSignal } from "@wirestate/react-signals";',
    'import type { Model, ReadonlySignal } from "@wirestate/react-signals";',
    'import { createContainer as createWirestateContainer, ContainerProvider as WirestateContainerProvider } from "wirestate";',
    'import { Action as WirestateAction } from "wirestate/mobx";',
    'import type { AnnotationMapEntry as WirestateAnnotationMapEntry, IActionFactory as WirestateActionFactory } from "wirestate/mobx";',
    'import { signal as wirestateSignal } from "wirestate/signals";',
    'import type { Model as WirestateModel, ReadonlySignal as WirestateReadonlySignal } from "wirestate/signals";',
    'import { mockContainer as wirestateMockContainer } from "wirestate/test-utils";',
    "",
    "type MobxTypeExportSmoke = AnnotationMapEntry | IActionFactory | WirestateAnnotationMapEntry | WirestateActionFactory;",
    "type ReactSignalsTypeExportSmoke = Model | ReadonlySignal<unknown> | WirestateModel | WirestateReadonlySignal<unknown>;",
    "type LitSignalsTypeExportSmoke = WatchDirectiveFunction;",
    "",
    "const config: ContainerConfig = {};",
    "const container = createContainer(config);",
    "const mobxTypeExportSmoke: MobxTypeExportSmoke | null = null;",
    "const reactSignalsTypeExportSmoke: ReactSignalsTypeExportSmoke | null = null;",
    "const litSignalsTypeExportSmoke: LitSignalsTypeExportSmoke | null = null;",
    "",
    "void container;",
    "void mobxTypeExportSmoke;",
    "void reactSignalsTypeExportSmoke;",
    "void litSignalsTypeExportSmoke;",
    "void LitContainerProvider;",
    "void litSignal;",
    "void ReactContainerProvider;",
    "void Action;",
    "void reactSignal;",
    "void createWirestateContainer;",
    "void WirestateContainerProvider;",
    "void WirestateAction;",
    "void wirestateSignal;",
    "void wirestateMockContainer;",
    "",
  ].join("\n");
}

function viteConfigSource(): string {
  return [
    "export default {",
    '  logLevel: "silent",',
    "  build: {",
    "    emptyOutDir: true,",
    '    outDir: "dist",',
    '    target: "es2022",',
    "    lib: {",
    '      entry: "src/vite-entry.ts",',
    '      fileName: "wirestate-consumer",',
    '      formats: ["es"],',
    "    },",
    "  },",
    "};",
    "",
  ].join("\n");
}

function viteEntrySource(): string {
  return [
    'import { createContainer } from "@wirestate/core";',
    'import { ContainerProvider as LitContainerProvider } from "@wirestate/lit";',
    'import { signal as litSignal } from "@wirestate/lit-signals";',
    'import { ContainerProvider as ReactContainerProvider } from "@wirestate/react";',
    'import { Action } from "@wirestate/react-mobx";',
    'import { signal as reactSignal } from "@wirestate/react-signals";',
    'import { createContainer as createWirestateContainer, ContainerProvider as WirestateContainerProvider } from "wirestate";',
    'import { Action as WirestateAction } from "wirestate/mobx";',
    'import { signal as wirestateSignal } from "wirestate/signals";',
    "",
    "export const consumed = [",
    "  createContainer,",
    "  LitContainerProvider,",
    "  litSignal,",
    "  ReactContainerProvider,",
    "  Action,",
    "  reactSignal,",
    "  createWirestateContainer,",
    "  WirestateContainerProvider,",
    "  WirestateAction,",
    "  wirestateSignal,",
    "];",
    "",
  ].join("\n");
}

function packageDestination(packageName: string): string {
  if (!packageName.startsWith("@")) {
    return path.resolve(CONSUMER_ROOT, "node_modules", packageName);
  }

  const [scope, name] = packageName.split("/");

  return path.resolve(CONSUMER_ROOT, "node_modules", scope, name);
}

function copyStagedPackage(pkg: StagedPackageDescriptor): void {
  const source = path.resolve(STAGED_PACKAGES_ROOT, pkg.directory);
  const destination = packageDestination(pkg.name);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing staged package ${source}. Run pnpm build before package consumption tests.`);
  }

  fs.cpSync(source, destination, { recursive: true });
}

export function run(command: string, args: Array<string>, cwd: string = CONSUMER_ROOT): CommandResultDescriptor {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      FORCE_COLOR: "0",
    },
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        `Exit code: ${result.status ?? "unknown"}`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return {
    stderr: result.stderr,
    stdout: result.stdout,
  };
}
