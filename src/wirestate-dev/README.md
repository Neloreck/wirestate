# @wirestate/dev [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://Neloreck.github.io/wirestate/)]

[![npm](https://img.shields.io/npm/v/@wirestate/dev.svg?style=flat-square)](https://www.npmjs.com/package/@wirestate/dev)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/Neloreck/wirestate/blob/main/LICENSE)

Bundler plugins enabling hot reload for Wirestate services.

Use this package during development so that editing a service file swaps the affected containers in place instead of
remounting the application tree. It applies to the dev server only and has no effect on production builds.

## Install

```bash
npm install --save-dev @wirestate/dev
```

## Start

Register the plugin in the Vite config, before the framework plugin:

```ts
import { wirestate } from "@wirestate/dev/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [wirestate(), react()],
});
```

Application code stays as it is. Containers, providers, and services need no changes.

Editing a service now reports the swap instead of reloading the page:

```
[wirestate] Hot swap replaced 1 container(s).
```

## How It Works

Wirestate keys bindings by class identity, and a hot update replaces the class. The plugin appends a footer to every
module declaring `@Injectable()` classes that registers each class generation under a stable id and accepts the module's
own hot updates. The update stops propagating up the import graph, and the Wirestate runtime rebuilds the containers
bound to the previous class: teardown deepest-first, then replacements root-first, as one synchronous step.

React state, DOM state, scroll position, and form inputs survive. Services are constructed fresh, so resource work
belongs in `@OnProvision` and cleanup in `@OnDeprovision`.

## What Is Included

- `@wirestate/dev/vite`: the `wirestate()` Vite plugin, with `include` and `exclude` options for projects using
  different file conventions.
- The package root: `transformHotModule`, `findInjectableClassNames`, and `createHotFooter`, the bundler-agnostic
  transform the adapters build on.

By default `.ts`, `.mts`, `.js`, and `.mjs` files are transformed, skipping `node_modules`, declaration files, test
files, and server-side transforms. Component files (`.tsx`, `.jsx`) are excluded because React Fast Refresh already owns
them, so keep services in their own modules.

Requires [`@wirestate/core`](https://www.npmjs.com/package/@wirestate/core) in the application: the injected footer
imports the `@wirestate/core/hot` runtime that performs the swap.

## Learn More

- [Hot reload guide](https://Neloreck.github.io/wirestate/core/hot-reload)
- [API reference](https://Neloreck.github.io/wirestate/api/wirestate-dev/)

## License

MIT
