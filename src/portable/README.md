# @wirestate/portable [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

This directory contains entry points for building "portable" bundles of Wirestate. These entries combine core functionality with framework bindings and reactivity integrations into single entry points, suitable for specific target environments or simplified distribution.

## Available Entries

- **Core (`wirestate.ts`)**
  - Bundles `@wirestate/core`.
  - Provides the base DI container, services, events, commands, and queries.
  - Includes `@wirestate/core/test-utils`.

- **Lit Signals (`wirestate-lit-signals.ts`)**
  - Bundles `@wirestate/core`, `@wirestate/lit`, and `@wirestate/lit-signals`.
  - Full Wirestate stack for Lit components using Signals for reactivity.
  - Includes test utilities for core and lit.

- **React MobX (`wirestate-react-mobx.ts`)**
  - Bundles `@wirestate/core`, `@wirestate/react`, and `@wirestate/react-mobx`.
  - Full Wirestate stack for React components using MobX for reactivity.
  - Includes test utilities for core and react.

- **React Signals (`wirestate-react-signals.ts`)**
  - Bundles `@wirestate/core`, `@wirestate/react`, and `@wirestate/react-signals`.
  - Full Wirestate stack for React components using Preact Signals for reactivity.
  - Includes test utilities for core and react.

Each entry point re-exports both the library functionality and its corresponding test utilities.
