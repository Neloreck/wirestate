# Hot Reload

Editing a service file during development replaces its class. Because Wirestate keys bindings by class identity, the
running container still holds the previous class, and components that re-render after the update ask for the new one.
Without help, the two never meet: the update either propagates up to the module that builds the container and remounts
the tree, or resolution fails with `No binding(s) found`.

`@wirestate/dev` closes that gap. It makes service modules accept their own hot updates and rebuilds the affected
containers in place, so the React tree stays mounted.

## Install

```bash
npm install --save-dev @wirestate/dev
```

Register the plugin in the Vite config. It only applies to the dev server, so production builds are untouched.

```ts
import { wirestate } from "@wirestate/dev/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [wirestate(), react()],
});
```

No changes are needed in application code. Containers, providers, and services stay as they are.

## What Happens On An Edit

When a module declaring `@Injectable()` classes is edited:

1. The module accepts its own update, so the change stops propagating up the import graph.
2. Every container bound to an older generation of the edited class is collected, along with every container parented to
   one of them.
3. Those containers are torn down deepest-first: `@OnDeprovision`, then `@OnDeactivation`.
4. Replacements are constructed root-first from the original config, remapped onto the new classes, and provisioned.

Steps 2 to 4 run as one synchronous block, so no component renders while a container is torn down.

Console output reports each swap:

```
[wirestate] Hot swap replaced 1 container(s).
```

Components holding a reference to the previous class still resolve correctly: the container resolves through the newest
generation of a class before falling back to the token it was given.

## What Is Preserved

React state, DOM state, scroll position, form inputs, and routing survive the swap. Only the containers change.

Service state does not survive. Services are constructed fresh, exactly as on a normal mount. This matches how a page
reload behaves and keeps the swap predictable: a hot-swapped service is never in a state its constructor could not
produce.

Because services are rebuilt, resource work belongs in `@OnProvision` and cleanup in `@OnDeprovision`. See
[Core Lifecycle](/core/lifecycle). A service that follows that rule needs nothing extra to be hot-reload safe.

## Telling A Hot Swap From A Real Teardown

Some cleanup is too expensive or too destructive to repeat on every edit: closing a project, releasing a native handle,
ending a session. `isHotSwapping()` reports whether the current teardown is part of a hot swap, so a handler can skip
that work and keep the resource open.

```ts
import { Injectable, OnDeactivation } from "@wirestate/core";
import { isHotSwapping } from "@wirestate/core/hot";

@Injectable()
export class ProjectService {
  @OnDeactivation()
  public onDeactivation(): void {
    // A hot swap replaces this service, not the user's session. Keep the project open.
    if (isHotSwapping()) {
      return;
    }

    this.closeProject();
  }
}
```

It returns `true` for the whole swap block, so both `@OnDeprovision` and `@OnDeactivation` see it, and `false` during an
ordinary unmount, unbind, or page teardown. In production it is always `false`.

Two limits are worth knowing:

- It reports container swaps only. Editing the module that builds the config remounts the provider instead, and that
  teardown is indistinguishable from a real one. When the side effect is expensive enough, guard on the environment
  instead: `if (process.env.NODE_ENV !== "production") return;`.
- The replacement service is constructed fresh. Skipping cleanup keeps the external resource alive, but the new instance
  must be able to adopt it, usually by re-reading it in `@OnProvision`.

## Which Files Are Transformed

By default the plugin transforms `.ts`, `.mts`, `.js`, and `.mjs` files, skipping `node_modules`, declaration files, and
test files.

Component files (`.tsx`, `.jsx`) are excluded on purpose. React Fast Refresh already owns those, and a service declared
next to a component would create two competing hot-update boundaries in one module. Keep services in their own modules.

Override the defaults when your project uses different conventions:

```ts
wirestate({ include: /\.service\.ts$/ });
```

## Limitations

**External containers are not swapped by default.** A container passed through `ContainerProvider`'s `container` prop is
owned by your code, not the provider, so the runtime does not tear it down or replace it. Editing a service bound to an
external container leaves the old instance running, and resolution keeps answering with the previous class. Opt in with
[Owning The Swap](#owning-the-swap) when the container should participate.

**Factory and value bindings are not remapped.** Their behavior lives in closures in the module that builds the config,
not in a class. Editing that module is an ordinary hot update: it re-runs the config and, when the provider remounts,
builds a fresh container from it.

**Only named module-scope classes declared with `@Injectable()` participate.** The plugin parses JavaScript and
TypeScript modules before inspecting their top-level declarations. It ignores comments, strings, template text, and
classes nested inside functions or blocks. Import `Injectable` directly from `@wirestate/core` or `wirestate`; aliases
are supported. Imports through a local re-export are not detected.

**A handler that forces synchronous rendering breaks the swap.** Calling `flushSync` from `@OnDeprovision` or
`@OnDeactivation` renders while containers are being replaced. Wirestate detects this and throws a message naming the
cause instead of a missing-binding error.

**Async lifecycle continuations still need guarding.** Deprovision does not await handlers, so an async continuation can
resume after its service was replaced. Guard it with `WireStatus`, exactly as on unmount. See
[Core Lifecycle](/core/lifecycle).

If a swap throws, the previous containers are already torn down and the page cannot keep running on them, so the runtime
logs the error and reloads.

## Owning The Swap

A container created outside React — during bootstrap, for non-React consumers, or before the first render — has no
provider to rebuild it. Register it as its own hot-swap owner to give it the same treatment a managed container gets,
including the `@OnDeactivation` pass the provider would never run for it.

```tsx
import { Container, ContainerConfig } from "@wirestate/core";
import { registerHotSwapOwner } from "@wirestate/core/hot";
import { ContainerProvider } from "@wirestate/react";
import { useEffect, useRef, useState } from "react";

const CONFIG: ContainerConfig = { bindings: [ProjectService], activate: true };

export const CONTAINER: Container = new Container(CONFIG);

export function ApplicationProvider({ children }: PropsWithChildren) {
  const [container, setContainer] = useState<Container>(CONTAINER);

  // One owner for the lifetime of the component. The runtime keeps its container and config
  // current as it swaps.
  const owner = useRef({
    container: CONTAINER,
    config: CONFIG,
    create: (config: ContainerConfig) => new Container(config),
    commit: setContainer,
  });

  useEffect(() => registerHotSwapOwner(owner.current), []);

  return <ContainerProvider container={container}>{children}</ContainerProvider>;
}
```

`registerHotSwapOwner` returns an unregister callback, so returning it from the effect keeps the registration tied to the
component. Three details make this work:

- `commit` must publish the replacement into React state. Reassigning a module-level variable rebuilds the container but
  never re-renders the tree, so the provider keeps rendering the previous one.
- `config` must be the config the container was constructed from. The runtime remaps its classes to their newest
  generations; it never reads the live container's bindings.
- Register one long-lived owner object. The runtime writes the remapped config back to it after a swap, so an owner
  rebuilt from `CONFIG` on every render would keep reading as outdated and rebuild its container on every later swap.

Gate the registration on `import.meta.hot` if you prefer the code to disappear outside development. If the container has
no reason to exist before React mounts, a managed `config` provider does all of this without the extra wiring.

## Without The Plugin

Hot reload is opt-in. With no plugin installed nothing changes: a service edit propagates to the module that builds the
container, and the behavior depends on how your bundler and framework integration handle that module. The runtime is
inert until a transformed module registers a class.
