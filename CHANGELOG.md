## Unreleased

- `bindConstant`, `bindDynamicValue`, and `bindEntry`: validate injectable descriptors and throw `WirestateError` for invalid binding config
- `bindEntry`: support class bindings behind custom `id` tokens while preserving Wirestate lifecycle wiring
- `bindService`: report missing `reflect-metadata` with a dedicated `WirestateError`; declare `reflect-metadata` as a core peer dependency
- `WireScope.getSeed`: preserve falsy targeted seed values and return `null` only when the targeted seed is missing
- React providers: recreate managed containers when normalized `seed`, `seeds`, `entries`, or `activate` config changes
- Add ESM package export entries for `@wirestate/core/test-utils` and `@wirestate/react/test-utils`
- Add `@wirestate/lit/test-utils` package build and export entries
- `@wirestate/react-mobx`: export missing MobX aliases
- Add `useScope` in `@wirestate/react`
- New lit elements modules - `@wirestate/lit` and `@wirestate/lit-signals`
- `EventBus`: add `unsubscribe` method for explicit handler removal by reference
- `QueryBus`: add `unregister` method for explicit handler removal by type and reference
- `CommandBus`: add `unregister` method for explicit handler removal by type and reference
- `WireScope`: add new event/command/query subscribe-unsubscribe methods
- Export more alias / methods from `@wirestate/core`
- Export more alias / methods from `@wirestate/react-mobx`
- Export missing methods typing for `@wirestate/core`
- Extensive JSDoc coverage for wirestate packages
- `createIocContainer`: Removed in favor of `createContainer`
- `createContainer`: Added ability to instantly provide and activate entries, targeted seeds
- `ContainerConfig`: Added public alias for reusable container creation configuration
- `getContainerEntries`: Added public helper for inspecting entries registered through Wirestate binding helpers
- `createInjectablesProvider`: Removed
- `IocProvider`: Removed
- `ContainerProvider`: Split React props into external `container` and managed `config`, activate managed entries by default, and provision registered provider lifecycle services
- `SubContainerProvider`: Added component solving problems of removed `createInjectablesProvider`; child providers activate entries by default and support `activate` overrides
- `OnProvision` / `OnDeprovision`: UI lib rendering lifecycle separated from IOC lifecycle
- Replace IoC-context provision APIs with `ContainerContext`, `containerProvide`, `ContainerProvider`, and `useContainerProvision`
- Replace injectables-provider APIs with `subContainerProvide`, `SubContainerProvider`, and `useSubContainerProvider`
- Provide plain `Container` values through Lit context instead of wrapper objects
- Recreate managed child containers when the parent container context changes
- Add `useContainer` and `useScope` consumers in `@wirestate/lit`
- Remove low-value core shortcut helpers: `command`, `commandOptional`, `emitEvent`, `query`, and `queryOptional`; use `WireScope` or the container-scoped buses directly
- `EventBus.emit`: use `(type, payload?, from?)` arguments, matching `WireScope.emitEvent` and React event emitters
- `QueryBus`: make `query` / `queryOptional` synchronous by default and add `queryAsync` / `queryOptionalAsync` for Promise-normalized calls
- `WireScope`: add `queryDataAsync` and `queryOptionalDataAsync`
- `@wirestate/react`: replace `useSyncQueryCaller` / `useOptionalSyncQueryCaller` with `useQueryCaller` / `useOptionalQueryCaller`; add `useAsyncQueryCaller` / `useOptionalAsyncQueryCaller` for Promise-normalized calls

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
