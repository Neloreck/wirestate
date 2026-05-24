## Unreleased

### Added

- Add `@wirestate/lit`, including Lit context provisioning, `ContainerProvider`, `SubContainerProvider`, `containerProvide`, `subContainerProvide`, `useContainerProvision`, and `useSubContainerProvider`.
- Add Lit consumption APIs: `useContainer`, `useScope`, `injection`, `useInjection`, `optionalInjection`, and `useOptionalInjection`.
- Add Lit event, command, and query adapters: `onEvent`, `onCommand`, `onQuery`, `OnEventController`, `OnCommandController`, `OnQueryController`, `useOnEvents`, `useOnCommand`, and `useOnQuery`.
- Add `@wirestate/lit-signals` with `@lit-labs/signals` and `signal-polyfill` re-exports and package metadata.
- Add `@wirestate/lit/test-utils` with `createLitProvision`, plus package build and export entries.
- Add portable bundle entry points for core, React MobX, React Signals, and Lit Signals targets.
- Add `createContainer`, `CreateContainerOptions`, `ContainerConfig`, and `ContainerActivation` as the current core container creation API.
- Add immediate seed application, service provisioning, and activation options to `createContainer`.
- Add `getContainerEntries` and `getEntryToken` for inspecting entries registered through Wirestate binding helpers.
- Add core `OnProvision` and `OnDeprovision` decorators plus `provisionContainer`, `deprovisionContainer`, `provisionServices`, and `deprovisionServices`.
- Add explicit handler cleanup APIs: `EventBus.unsubscribe`, `CommandBus.unregister`, and `QueryBus.unregister`.
- Add `WireScope` event, command, and query registration helpers, including unsubscribe/unregister methods and async query helpers.
- Add `useScope` and context-level `useContainer` exports in `@wirestate/react`.
- Add React `SubContainerProvider` for managed child container provisioning.
- Add React `useAsyncQueryCaller` and `useOptionalAsyncQueryCaller` for Promise-normalized query calls.
- Add ESM/CJS package export entries for `@wirestate/core/test-utils` and `@wirestate/react/test-utils`.
- Add React `withContainerProvider` test utility and expand `mockContainer` coverage in core test utilities.
- Add centralized Inversify alias exports from `@wirestate/core`, including the missing `decorate` export.
- Add missing MobX alias exports in `@wirestate/react-mobx`.
- Add scoped-bus, seed, service shadowing, lifecycle, and provider replacement regression tests across core, React, and Lit.

### Changed

- Replace `createIocContainer` with `createContainer` and align public docs/examples around the new container API.
- Split activation and provision into separate lifecycle phases so framework rendering lifecycles are no longer coupled to service activation.
- Move provider lifecycle decorators and lifecycle execution helpers from framework packages into `@wirestate/core`.
- Give each container its own `EventBus`, `CommandBus`, `QueryBus`, and `WireScope` essentials while preserving inherited parent bindings.
- Keep command and query handlers stack-based so unregistering a handler restores the previous handler for that type.
- Make `QueryBus.query` and `QueryBus.queryOptional` synchronous by default, with `queryAsync` and `queryOptionalAsync` for Promise-normalized callers.
- Update React query hooks to match the sync/async split: `useQueryCaller`, `useOptionalQueryCaller`, `useAsyncQueryCaller`, and `useOptionalAsyncQueryCaller`.
- Change `EventBus.emit` to accept `(type, payload?, from?)`, matching `WireScope.emitEvent` and React event emitters.
- Simplify event payload typing and event dispatch construction.
- Split React `ContainerProvider` props into external `container` mode and managed `config` mode.
- Normalize managed React provider activation to `true`, recreate managed containers when shallow-compared config inputs change, and dispose only owned containers.
- Provision and deprovision external React containers without disposing them.
- Normalize React `SubContainerProvider` activation to `true`, recreate child containers when parent or config inputs change, and dispose owned child containers.
- Register React event, command, and query handlers with an isomorphic layout-timed effect so handlers are available before later effects run.
- Strengthen React `ContainerProvider` validation for invalid external/managed prop combinations.
- Replace Lit `options` naming with `config`, publish plain `Container` values through context, and recreate managed child containers when the parent context changes.
- Normalize Lit managed provider activation to `true`, validate Lit provider lifecycle config, and keep context publication tied to host connection state.
- Preserve named Inversify instances when framework providers resolve lifecycle services.
- Validate injectable descriptors in `bindConstant`, `bindDynamicValue`, `bindEntry`, and `bindService`, throwing `WirestateError` for invalid binding config.
- Support class bindings behind custom `id` tokens in `bindEntry` while preserving Wirestate lifecycle registration.
- Move container config validation into core with `validateContainerConfig` so React and Lit providers share the same rules.
- Rework seed storage around shared root seeds and targeted per-token seeds, including public `SEED` and `SEEDS` aliases.
- Update React, Lit, and example apps to use public aliases from `@wirestate/core` instead of direct Inversify imports.
- Update package metadata, peer dependencies, workspace configuration, and package-manager metadata for the expanded package set.

### Fixed

- Preserve falsy targeted seed values in `WireScope.getSeed` and return `null` only when targeted seed data is missing.
- Report missing `reflect-metadata` for service binding with a dedicated `WirestateError`, and declare `reflect-metadata` as a peer dependency where needed.
- Recreate managed React containers when normalized `seed`, `seeds`, `entries`, or `activate` values change.
- Recreate containers synchronously with rendering where required so consumers do not see stale container state.
- Recreate child containers when the parent config or parent container changes.
- Correct React `useContainer` subscription behavior.
- Correct React optional injection fallback behavior and dependency resolution rules.
- Correct Lit `useInjection` typing and add optional injection API coverage for fallbacks, missing bindings, dependency changes, and cleanup.
- Correct lifecycle invocation ordering, deactivation error handling, and provider provision/deprovision ordering.
- Correct scoped event/query/command bus isolation and container parent binding behavior.
- Correct missing public exports and export-list tests for core, React, React MobX, React Signals, and Lit packages.
- Correct package structure for Lit test utilities and portable bundles.

### Removed

- Remove `createIocContainer`; use `createContainer`.
- Remove React `IocProvider`, `createInjectablesProvider`, `useIocContext`, and provider-local `useContainer` / `useInjection` / `useOptionalInjection` paths in favor of context and provider APIs exported from `@wirestate/react`.
- Remove experimental React `useRootContainer` and `useContainerRevision`.
- Remove low-value core shortcut helpers: `command`, `commandOptional`, `emitEvent`, `query`, and `queryOptional`.
- Remove `useSyncQueryCaller` and `useOptionalSyncQueryCaller`; use `useQueryCaller` / `useOptionalQueryCaller` for sync results and async hooks for Promise-normalized results.

### Documentation and Tooling

- Add the VitePress docs site, Typedoc generation, API docs source-link plugin, docs workflows, and guide pages for containers, services, seeds, messaging, testing, React MobX, React Signals, and Lit Signals.
- Add and update README files for core, React, Lit, React MobX, React Signals, Lit Signals, portable bundles, and the root project.
- Add installation guidance for `signal-polyfill` in Lit Signals setup.
- Add a standalone Lit Signals example app and update React MobX / React Signals examples for the new provider and messaging APIs.
- Add package version bump scripts and run configurations for docs and package workflows.
- Update Jest, ESLint, Prettier, Rollup, pnpm workspace, lockfile, and package export configuration for the current package layout.

## 0.6.3

- Update readme files for each module

## 0.6.2

- Corrected build system, react package structure

## 0.6.1

- React related types moved to react lib
- Avoid prefixed I/T types

## 0.6.0

- Split wirestate as separate @wirestate packages

## 0.5.0

- Add default initial state param on creation of containers
- Explicit typing for query callers, export new types
- For wire-scope add missing optional query/command/resolve methods
- Add sourcemaps in lib bundles
- Add `signals` entry for variants of storage usage without mobx

## 0.4.0

- Add `OnActivated` decorator
- Add `OnDeactivated` decorator
- `initialState` -> `seed`
- `type` -> `bindingType`
- `scopeType` -> `bindingScopeType`
- Emit events with two params instead of manually composed object, signal `from`
- Add commands module
- Add WireScope shared class for managing of wirestate events, queries and commands
- Remove abstract service in favor of WireScope usage
- Signals -> events
- `useOptionalInjection` -> add fallback handler

## 0.3.0

- Rename `createServicesProvider` to `createInjectablesProvider`
- Add `useSignals`, `useSignalHandler` hooks for better signal handling ergonomics
- Add `useOptionalInjection` hook for safe resolution of optional dependencies
- Support optional queries via `queryOptional`, `useOptionalQueryCaller`, and `useOptionalSyncQueryCaller`
- Support merging of initial states when multiple providers co-exist
- Add more re-exports from `mobx` and `inversify` for easier consumer usage
- Improve test coverage, extend test utilities
- Correctly notify about `IS_DISPOSED` after deactivation of services

## 0.2.0

- Activate and deactivate services in stack ordering
- Portable libs will not fail with react compiler builds
- Extend test-utils
- Increasing test coverage
- Error handling / custom error class
- Allow addition of constant bindings in the IOC container
- useService -> useInjection
- AbstractService::getService -> AbstractService::resolve

## 0.1.0

- Initial release
