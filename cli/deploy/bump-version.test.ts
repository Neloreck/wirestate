import { updateInternalDependencyVersions } from "./bump-version.utils";

describe("package version bump", () => {
  it("uses exact internal peer dependency versions for prerelease packages", () => {
    const manifest: Record<string, unknown> = {
      peerDependencies: {
        "@wirestate/core": ">=0.7.0-experimental.7",
        "@wirestate/react": "^0.7.0-experimental.7",
        react: ">=16.8.0 <20.0.0",
      },
    };

    updateInternalDependencyVersions(
      manifest,
      new Set(["@wirestate/core", "@wirestate/react"]),
      "0.7.0-experimental.8"
    );

    expect(manifest.peerDependencies).toEqual({
      "@wirestate/core": "0.7.0-experimental.8",
      "@wirestate/react": "0.7.0-experimental.8",
      react: ">=16.8.0 <20.0.0",
    });
  });

  it("uses caret internal peer dependency ranges for stable packages", () => {
    const manifest: Record<string, unknown> = {
      peerDependencies: {
        "@wirestate/core": "workspace:*",
      },
    };

    updateInternalDependencyVersions(manifest, new Set(["@wirestate/core"]), "1.0.0");

    expect(manifest.peerDependencies).toEqual({
      "@wirestate/core": "^1.0.0",
    });
  });

  it("updates internal dependencies and optional dependencies", () => {
    const manifest: Record<string, unknown> = {
      dependencies: {
        "@wirestate/core": "workspace:*",
      },
      optionalDependencies: {
        "@wirestate/react-mobx": "workspace:*",
      },
      peerDependencies: {
        "@wirestate/react": "workspace:*",
      },
    };

    updateInternalDependencyVersions(
      manifest,
      new Set(["@wirestate/core", "@wirestate/react", "@wirestate/react-mobx"]),
      "1.0.0"
    );

    expect(manifest.dependencies).toEqual({
      "@wirestate/core": "^1.0.0",
    });
    expect(manifest.optionalDependencies).toEqual({
      "@wirestate/react-mobx": "^1.0.0",
    });
    expect(manifest.peerDependencies).toEqual({
      "@wirestate/react": "^1.0.0",
    });
  });
});
