## Unreleased

### Added

- Add a built-in dependency injection container (vendored fork of [needle-di](https://github.com/needle-di/needle-di),
  MIT, © Dirk Luijk — since fully assimilated into the core layout) at `@wirestate/core` — synchronous resolution,
  explicit bindings, per-binding `Singleton`/`Transient` scopes, activation/deactivation hooks, lifecycle-aware
  `unbind`/`unbindAll`, `hasOwn`, public `container.parent`, and named
  `NoBindingFoundError`/`CircularDependencyError` errors.
- Add `inject(token, options?)` as the single injection style (constructor parameter defaults and field initializers),
  with `optional` and `lazy` options. `inject()` works identically under legacy decorators, TC39 standard
  decorators, and no decorators at all.
- Add `InjectionToken` for type-safe non-class tokens and `isInjectable` for `@Injectable` checks.
- Add `onActivated`/`onDeactivated` lifecycle hooks on all binding descriptors. For instance bindings the hooks
  compose with the Wirestate lifecycle: activation hooks run after `@OnActivated`, deactivation hooks run before
  `@OnDeactivation` cleanup.
- Add bare service class support to `container.bind`: `container.bind(MyService)` registers a singleton instance
  binding with full Wirestate wiring. Instance binding descriptors gain an optional `skipActivationHooks` field.
- Add container introspection: `container.getOwnBindings()` (registration order),
  `container.getActiveInstances()` (creation order), and the `getInstanceContainer(instance)` helper.
- Add `container.addUnbindInterceptor(interceptor)` — interceptors run before deactivation in `container.unbind`
  and `container.unbindAll`, which is how provider deprovision precedes `@OnDeactivation` without wrapper APIs.
- Add TC39 standard decorator support for every Wirestate decorator: `@Injectable`, `@OnActivated`,
  `@OnDeactivation`, `@OnProvision`, `@OnDeprovision`, `@OnEvent`, `@OnCommand`, and `@OnQuery` are dual-mode —
  the same source compiles under legacy `experimentalDecorators` and standard (`2023-11`) decorators. Standard-mode
  metadata is stored via decorator metadata (`Symbol.metadata`); a one-line polyfill ships with the package and loads
  automatically. The decorator behavior suite runs in CI under both compilation modes.

- Add `@wirestate/lit` with Lit context provisioning, `ContainerProvider`, `provideContainer`,
  `useContainerProvider`, injection decorators/controllers, event/command/query decorators, and controllers.
- Add framework-agnostic `@wirestate/mobx` (`mobx` re-exports and decorator aliases) and `@wirestate/signals`
  (`@preact/signals-core` re-exports) so observable and signal services can be shared across React and Lit.
- Add `@wirestate/lit-mobx` (MobX Lit reactivity binding via `@adobe/lit-mobx`) and `@wirestate/lit-signals`
  (Preact Signals Lit reactivity binding via `@lit-labs/preact-signals`).
- Scope `@wirestate/react-mobx` and `@wirestate/react-signals` to their React reactivity bindings; observable and
  signal definitions now live in `@wirestate/mobx` and `@wirestate/signals`.
- Add the compatibility `wirestate` package with core, React, MobX, and Signals entry points.
- Add portable ESM bundle entry points for core, React MobX, Lit MobX, React Signals, and Lit Signals targets.
- Add `createContainer`, `ContainerConfig`, and `CreateContainerOptions` as the current container creation API.
- Add `OnProvision` and `OnDeprovision` to `@wirestate/core`, plus provider lifecycle helpers used by React and Lit
  adapters.
- Add explicit handler cleanup APIs: `EventBus.unsubscribe`, `CommandBus.unregister`, and `QueryBus.unregister`.
- Add `WireScope` event, command, and query registration helpers and async query/command helpers.
- Add `WireStatus` and `ProvisionId` for service lifecycle guards across provider provision cycles.
- Add React and Lit provider `scope` options so managed child containers can use local messaging buses or inherit parent
  buses.
- Add React `useContainer`, `useScope`, `useAsyncCommandExecutor`, `useOptionalAsyncCommandExecutor`,
  `useAsyncQueryExecutor`, and `useOptionalAsyncQueryExecutor`.
- Add expanded MobX, React Signals, Lit Signals, and DI alias exports.
- Add number support for event, command, and query identifiers.
- Add regression tests for scoped buses, service shadowing, lifecycle, event subscriptions, controller cleanup,
  SSR, package consumption, and provider replacement.

### Changed

- Replace InversifyJS with the built-in DI container. The DI stack is no longer an external dependency: consumer bundles
  drop ~57 KB min of inversify and ~14 KB min of reflect-metadata; the complete core including DI now measures
  ~24.6 KB min / ~7.4 KB gzip.
- Make the container the single owner of service lifecycle: `container.bind` wires `@OnEvent`/`@OnCommand`/`@OnQuery`
  handler registration, `WireStatus` tracking, and `@OnActivated`/`@OnDeactivation` hooks for instance bindings, so
  binding a service class through the container can no longer produce a half-wired service. Instance and handler
  tracking moved from module-level registries onto container activation records.
- Unify the error model on `WirestateError`: `NoBindingFoundError` and `CircularDependencyError` extend it with
  `NO_BINDING_FOUND`/`CIRCULAR_DEPENDENCY` codes, and container binding validation throws `WirestateError` with
  `INVALID_ARGUMENTS`/`INVALID_BINDING_SCOPE`/`VALIDATION_ERROR` codes.
- Migrate constructor injection from `@Inject`/`@Optional` parameter decorators to `inject()` /
  `inject(token, { optional: true })`. Parameter decorators do not exist in TC39 standard decorators, so this is the
  portable injection style going forward.
- `@Injectable()` is now enforced at bind time for class bindings and acts as a pure validation marker — no metadata
  emission is involved.
- Binding descriptors without `scope` are always singletons (previously, raw Inversify containers defaulted to
  transient while `createContainer` forced singleton).
- `unbindAll` deactivates container-owned services in creation order and keeps bindings resolvable until every
  deactivation handler has run; `@OnDeprovision` still runs in reverse order first.
- Resolution errors read `No binding(s) found for X` and are thrown as `NoBindingFoundError`.
- Replace `createIocContainer` with `createContainer`, using `createContainer(config, options)` for reusable container
  config and creation tweaks.
- Split service activation/deactivation from provider provision/deprovision so framework rendering lifecycles are no
  longer coupled to service activation.
- Move provider lifecycle decorators and lifecycle execution helpers from framework packages into `@wirestate/core`.
- Give each container its own `EventBus`, `CommandBus`, `QueryBus`, and `WireScope` essentials while preserving
  inherited parent bindings. Child containers can inherit parent messaging with `skipMessaging` or provider
  `scope="parent"`.
- Keep command and query handlers stack-based so unregistering a handler restores the previous handler for that type.
- Make `QueryBus.query` and `QueryBus.queryOptional` synchronous by default, with async variants for Promise-normalized
  consumers.
- Rename React command/query APIs from `Caller` naming to `Executor` naming.
- Rename React `useEventsHandler` to `useAllEvents`.
- Change event emitters to accept `(type, payload?, options?)` with `options.source` instead of a positional source
  argument.
- Rename the public service identifier type to `Identifier`.
- Rename `skipLifecycle` container/bind options to `skipActivationHooks`.
- Reorder `CommandHandler` and `QueryHandler` generics to result, payload, and type. Update React and Lit command/query
  types to use payload terminology.
- Split React `ContainerProvider` props into external `container` mode and managed `config` mode; managed providers
  activate bindings by default, recreate containers on config changes, and dispose only owned containers.
- Update Lit provider APIs around `config`, plain `Container` context values, connection-scoped publication, and managed
  container activation by default.
- Rework binding descriptors around `token`, `type`, and `scope` fields, and support constant, dynamic value, factory,
  instance, resolved value, and service redirection bindings.
- Rename binding lifecycle internals, JSDoc, and internal error descriptors from service to instance terminology.
- Rework `wirestate` compatibility package entry points to re-export the published `@wirestate/*` packages directly.
- Update package metadata, peer dependencies, workspace configuration, and package-manager metadata for the expanded
  package set.

### Fixed

- Report missing `reflect-metadata` for service binding with a dedicated `WirestateError`, and declare
  `reflect-metadata` as a peer dependency where needed.
- Recreate managed React containers when normalized `bindings`, `parent`, or `activate` values change.
- Recreate containers synchronously with rendering where required so consumers do not see stale container state.
- Track provider deprovision state for resolved services, even when they do not declare provider lifecycle hooks.
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
- Correct package structure, package consumption checks, and ESM export paths for compatibility packages and portable
  bundles.

### Removed

- Remove seed support from `@wirestate/core`: the `seed`/`seeds` container config, the `SEED`/`SEEDS` tokens,
  `WireScope.getSeed`, and the `SeedsMap`/`SeedBindings`/`SeedBinding`/`SeedKey` types. Pass construction-time data as
  ordinary value bindings instead (`bind({ token, value })` + `inject(token)`); the container resolves them, and
  framework providers recreate on `bindings` change.
- Remove the `inversify` dependency and the `reflect-metadata` peer dependency. Applications no longer import
  `reflect-metadata` at their entry points, and `emitDecoratorMetadata` is no longer required in consumer tsconfigs.
- Remove `@Inject`, `@Optional`, `@MultiInject`, `@Named`, and `@Tagged` from the public API — use `inject()` options
  instead (named/tagged bindings had no replacement use case).
- Remove `forwardRef` and `LazyIdentifier` — `inject()` evaluates tokens at construction time, so late declarations
  need no wrapper; use `inject(token, { lazy: true })` for circular dependencies.
- Remove the `Request` binding scope.
- Reduce binding descriptors to three kinds: `Value` (renamed from `ConstantValue`), `Instance`, and `Factory`
  (absorbing `DynamicValue`). `ResolvedValue` is removed — factories run inside the injection context, so
  `inject()` works directly in factory bodies. `ServiceRedirection` is removed — alias tokens with a factory
  delegating to `container.get`.
- Move `@Injectable()` into the DI base, enforced there for instance bindings; the decorator and `isInjectable`
  keep their public exports.
- Limit `Transient` scope to factory bindings — transient class instances would bypass deactivation tracking, so
  instance bindings are always singletons. Binding descriptor types are now declared once in the DI base and
  re-exported.
- Trim the internal DI container to the surface Wirestate actually uses: `bindAll`, `createChild`,
  unbind-by-descriptor, implicit inheritance aliasing, multi-bindings, and service redirections are removed.
- Remove `bind`, `BindOptions`, `unbind`, and `unbindAll` from `@wirestate/core` — use `container.bind`,
  `container.unbind`, and `container.unbindAll` directly. `BindOptions.skipActivationHooks` moved onto instance
  binding descriptors, and `CreateContainerOptions.skipActivationHooks` stamps it on registered class bindings.

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

- Add the VitePress docs site, Typedoc generation, API docs source-link plugin, docs workflows, and guide pages for
  containers, services, lifecycle, messaging, testing, React MobX, React Signals, and Lit Signals.
- Add and update README files for core, React, Lit, React MobX, React Signals, Lit Signals, portable bundles, and the
  root project.
- Document `WireStatus`, provider deprovision tracking, and async lifecycle guards.
- Document provider messaging scope, `options.source` event metadata, and direct `@wirestate/core` usage in examples.
- Add installation guidance for `@preact/signals-core` in Lit Signals setup.
- Add a standalone Lit Signals example app and update React MobX / React Signals examples for the new provider and
  messaging APIs.
- Add package version bump scripts, publish safeguards, docs deployment workflow, package consumption tests, and run
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
