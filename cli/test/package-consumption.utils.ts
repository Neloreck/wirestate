import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const PROJECT_ROOT: string = path.resolve(__dirname, "../..");
const STAGED_PACKAGES_ROOT: string = path.resolve(PROJECT_ROOT, "target/pkg");

export const CONSUMER_ROOT: string = path.resolve(PROJECT_ROOT, "target/pkg-consumption-test");

type PackageExportCheckMode = "import" | "require";

export interface PackageCheckDescriptor {
  readonly directory: string;
  readonly exportName: string;
  readonly name: string;
}

interface CommandResultDescriptor {
  readonly stderr: string;
  readonly stdout: string;
}

export const PACKAGE_CHECKS: Array<PackageCheckDescriptor> = [
  { directory: "wirestate-core", exportName: "createContainer", name: "@wirestate/core" },
  { directory: "wirestate-react", exportName: "ContainerProvider", name: "@wirestate/react" },
  { directory: "wirestate-react-mobx", exportName: "Action", name: "@wirestate/react-mobx" },
  { directory: "wirestate-react-signals", exportName: "signal", name: "@wirestate/react-signals" },
  { directory: "wirestate-lit", exportName: "ContainerProvider", name: "@wirestate/lit" },
  { directory: "wirestate-lit-signals", exportName: "signal", name: "@wirestate/lit-signals" },
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

  for (const pkg of PACKAGE_CHECKS) {
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
    'import { ContainerProvider as ReactContainerProvider } from "@wirestate/react";',
    'import { Action } from "@wirestate/react-mobx";',
    'import { signal as reactSignal } from "@wirestate/react-signals";',
    "",
    "const config: ContainerConfig = {};",
    "const container = createContainer(config);",
    "",
    "void container;",
    "void LitContainerProvider;",
    "void litSignal;",
    "void ReactContainerProvider;",
    "void Action;",
    "void reactSignal;",
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
    "",
    "export const consumed = [",
    "  createContainer,",
    "  LitContainerProvider,",
    "  litSignal,",
    "  ReactContainerProvider,",
    "  Action,",
    "  reactSignal,",
    "];",
    "",
  ].join("\n");
}

function copyStagedPackage(pkg: PackageCheckDescriptor): void {
  const source = path.resolve(STAGED_PACKAGES_ROOT, pkg.directory);
  const destination = path.resolve(CONSUMER_ROOT, "node_modules", "@wirestate", pkg.name.replace("@wirestate/", ""));

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
