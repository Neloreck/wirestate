## Unreleased

### Added

- Add `@wirestate/lit` with Lit context provisioning, `ContainerProvider`, `provideContainer`,
  `useContainerProvider`, injection decorators/controllers, event/command/query decorators, and controllers.
- Add `@wirestate/lit-signals` with `@lit-labs/signals` and `signal-polyfill` re-exports.
- Add the compatibility `wirestate` package with core, React, React MobX, and React Signals entry points.
- Add portable ESM bundle entry points for core, React MobX, React Signals, and Lit Signals targets.
- Add `createContainer`, `ContainerConfig`, and `CreateContainerOptions` as the current container creation API.
- Add `OnProvision` and `OnDeprovision` to `@wirestate/core`, plus provider lifecycle helpers used by React and Lit
  adapters.
- Add explicit handler cleanup APIs: `EventBus.unsubscribe`, `CommandBus.unregister`, and `QueryBus.unregister`.
- Add `WireScope` event, command, and query registration helpers, async query/command helpers, `isDeprovisioned`, and
  `isInactive`.
- Add React and Lit `ContainerProviderScope`, `ContainerProviderScopeValue`, and `scope` options so managed child
  containers can either use container-local messaging buses or inherit parent buses.
- Add React `useContainer`, `useScope`, `useAsyncCommandExecutor`, `useOptionalAsyncCommandExecutor`,
  `useAsyncQueryExecutor`, and `useOptionalAsyncQueryExecutor`.
- Add expanded MobX, React Signals, Lit Signals, and Inversify alias exports.
- Add number support for event, command, and query identifiers.
- Add scoped-bus, seed, service shadowing, lifecycle, event subscription, controller cleanup, SSR, package-consumption, and
  provider replacement regression tests.

### Changed

- Replace `createIocContainer` with `createContainer`, using `createContainer(config, options)` for reusable container
  config and creation tweaks.
- Split service activation/deactivation from provider provision/deprovision so framework rendering lifecycles are no
  longer coupled to service activation.
- Move provider lifecycle decorators and lifecycle execution helpers from framework packages into `@wirestate/core`.
- Give each container its own `EventBus`, `CommandBus`, `QueryBus`, seeds, and `WireScope` essentials while preserving
  inherited parent bindings; child containers can opt into inherited messaging with `skipMessaging` or provider
  `scope: "parent"`.
- Keep command and query handlers stack-based so unregistering a handler restores the previous handler for that type.
- Make `QueryBus.query` and `QueryBus.queryOptional` synchronous by default, with async variants for Promise-normalized
  consumers.
- Rename React command/query APIs from `Caller` naming to `Executor` naming.
- Rename React `useEventsHandler` to `useAllEvents`.
- Change event emitters to accept `(type, payload?, options?)` with `options.source` instead of a positional source
  argument.
- Rename public Inversify aliases from `ServiceIdentifier` and `LazyServiceIdentifier` to `Identifier` and
  `LazyIdentifier`.
- Rename `skipLifecycle` container/bind options to `skipActivationHooks`.
- Reorder `CommandHandler` and `QueryHandler` generics to result, payload, and type, and update React/Lit command/query
  types to use payload terminology consistently.
- Split React `ContainerProvider` props into external `container` mode and managed `config` mode; managed providers
  activate bindings by default, recreate containers on config changes, and dispose only owned containers.
- Update Lit provider APIs around `config`, plain `Container` context values, connection-scoped publication, and managed
  container activation by default.
- Rework binding descriptors around `token`, `type`, and `scope` fields, and support constant, dynamic value, factory,
  instance, resolved value, and service redirection bindings.
- Rework seed storage around shared seeds and targeted per-token seeds, including public `SEED` and `SEEDS` aliases.
- Rename initial-state APIs and docs to seed/seeds terminology.
- Rename binding lifecycle internals, JSDoc, and internal error descriptors from service terminology to instance
  terminology.
- Rework `wirestate` compatibility package entry points to re-export the published `@wirestate/*` packages directly.
- Update package metadata, peer dependencies, workspace configuration, and package-manager metadata for the expanded
  package set.

### Fixed

- Preserve falsy targeted seed values in `WireScope.getSeed` and return `null` only when targeted seed data is missing.
- Report missing `reflect-metadata` for service binding with a dedicated `WirestateError`, and declare
  `reflect-metadata` as a peer dependency where needed.
- Recreate managed React containers when normalized `seed`, `seeds`, `bindings`, `parent`, or `activate` values change.
- Recreate containers synchronously with rendering where required so consumers do not see stale container state.
- Track provider deprovision state for services that inject `WireScope`, even when they do not declare provider
  lifecycle hooks.
- Correct React `useContainer` subscription behavior.
- Correct React optional injection fallback behavior and dependency resolution rules.
- Correct Lit `useInjection` typing and optional injection behavior for fallbacks, missing bindings, dependency changes,
  and cleanup.
- Correct lifecycle invocation ordering, deactivation error handling, and provider provision/deprovision ordering.
- Correct scoped event/query/command bus isolation and container parent binding behavior.
- Correct event bus indexing and unsubscription for typed, catch-all, duplicate, and mixed-type event subscriptions.
- Correct `@OnEvent` registration for inherited metadata and handlers with multiple event types.
- Correct React `useEvent` and `useEvents` cleanup when the container or subscribed event types change.
- Correct Lit event, command, and query controllers so they clean up previous registrations when context containers
  change.
- Correct service activation cleanup when `@OnActivated` throws.
- Correct React and Lit provider cleanup when provisioning or activation fails, and rethrow synchronous activation
  failures.
- Keep Lit consumers from receiving undefined context notifications on disconnection.
- Correct Lit `ContainerProvider` managed-container replacement so connected hosts do not share stale closure state.
- Correct missing public exports and export-list tests for core, React, React MobX, React Signals, and Lit packages.
- Correct package structure, package-consumption checks, and ESM export paths for compatibility packages and portable
  bundles.

### Removed

- Remove `createIocContainer`; use `createContainer`.
- Remove `@wirestate/core/test-utils`.
- Remove React `IocProvider`, `createInjectablesProvider`, `useIocContext`, and provider-local `useContainer` / `useInjection` / `useOptionalInjection` paths in favor of context and provider APIs exported from `@wirestate/react`.
- Remove experimental React `useRootContainer` and `useContainerRevision`.
- Remove low-value core shortcut helpers: `command`, `commandOptional`, `emitEvent`, `query`, and `queryOptional`.
- Remove React `Caller` query/command hooks and types; use `Executor` hooks and types instead.
- Remove public `ServiceIdentifier` and `LazyServiceIdentifier` aliases; use `Identifier` and `LazyIdentifier`.
- Remove experimental child/subcontainer provider APIs before release; use parent containers through `createContainer`
  config and normal `ContainerProvider` boundaries.
- Remove public exports for internal binding inspection helpers.

### Documentation and Tooling

- Add the VitePress docs site, Typedoc generation, API docs source-link plugin, docs workflows, and guide pages for containers, services, lifecycle, seeds, messaging, testing, React MobX, React Signals, and Lit Signals.
- Add and update README files for core, React, Lit, React MobX, React Signals, Lit Signals, portable bundles, and the root project.
- Document WireScope lifecycle state, provider deprovision tracking, and `scope.isInactive` async guard usage.
- Document provider messaging scope, `options.source` event metadata, and direct `@wirestate/core` usage in examples.
- Add installation guidance for `signal-polyfill` in Lit Signals setup.
- Add a standalone Lit Signals example app and update React MobX / React Signals examples for the new provider and
  messaging APIs.
- Add package version bump scripts, publish safeguards, docs deployment workflow, package-consumption tests, and run
  configurations for docs and package workflows.
- Bump packages and examples to `1.0.0-experimental.1`.
- Update Jest, ESLint, Prettier, Rollup, pnpm workspace, lockfile, and package export configuration for the current
  package layout.

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
