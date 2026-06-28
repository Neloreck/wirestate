# Core DevTools

`@wirestate/core/devtools` exposes a container tree to an inspector, such as a browser DevTools extension or a
standalone panel, for development-time debugging. It is opt-in and read-only: nothing is observed and nothing is written
to `globalThis` unless you register the plugin.

## Enable DevTools

Register `DevToolsPlugin` on a root container's `config.plugins`, guarded by `process.env.NODE_ENV` so a production
build drops it.

```ts
import { Container, type WirestatePlugin } from "@wirestate/core";
import { DevToolsPlugin } from "@wirestate/core/devtools";

const container = new Container({
  plugins: process.env.NODE_ENV === "production" ? [] : [new DevToolsPlugin()],
});
```

Bundlers replace `process.env.NODE_ENV` at build time, so a production build evaluates the guard to `[]` and
tree-shakes the plugin and the `@wirestate/core/devtools` import out of the bundle.

Installed on a root container, the plugin observes the whole subtree through container-chain inheritance, so one
registration covers every child container.

## Label a Root

Pass a `label` to tell one application root apart from others on the same page. Without it, the inspector identifies a
root only by a numeric id.

```ts
new DevToolsPlugin({ label: "checkout-app" });
```

## How It Is Consumed

On install, the plugin lazily creates a single page-global hook (`globalThis.__WIRESTATE_DEVTOOLS_HOOK__`) and registers
its container tree with it. An inspector reads the hook to render containers, bindings, active instances, declared
handlers, and the lifecycle and message stream. Inspection is read-only. DevTools never mutates application state.

Because the hook is a page global, treat it as a development-only surface. The `process.env.NODE_ENV` guard above keeps
the plugin and the hook out of production builds.

## API Reference

[`DevToolsPlugin`](/api/wirestate-core/devtools/classes/DevToolsPlugin),
[`DevToolsPluginConfig`](/api/wirestate-core/devtools/interfaces/DevToolsPluginConfig),
[`WirestatePlugin`](/api/wirestate-core/interfaces/WirestatePlugin).
