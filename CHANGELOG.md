## 0.6.4

- Todo

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

## 0.1.1

- Initial release
