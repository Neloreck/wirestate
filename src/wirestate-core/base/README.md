# Wirestate DI Base

Generic, wirestate-agnostic dependency injection container. Forked from [needle-di](https://github.com/needle-di/needle-di) (MIT, © Dirk Luijk) at v1.x and maintained independently — upstream merges are not expected.

This layer must stay free of wirestate-specific behavior (lifecycle decorators, events/commands/queries, seeds, provisioning). Wirestate semantics are layered on top through `@wirestate/core` binding helpers.

## Divergences from upstream needle-di

- **Tooling**: tests run on jest (converted from vitest), code follows repository eslint/prettier conventions, imports are extensionless.
- **Wirestate terminology**: the Angular-style provider model was renamed to wirestate binding descriptors — `Binding`/`BindingDescriptor` instead of `Provider`, `token`/`value`/`factory`/`service` fields instead of `provide`/`useValue`+`useClass`/`useFactory`/`useExisting` (class bindings carry `type: "Instance"`), `Identifier` instead of `Token`, scopes `"Singleton"`/`"Transient"`, and `NoBindingFoundError`. Wirestate-level descriptors pass through to `container.bind` without field mapping.
- **No async resolution**: `getAsync`, `injectAsync`, async factory providers, and `bootstrapAsync` are removed. Resolution is a single synchronous path — this also removes upstream's retry workaround for sync-over-async construction and the injection-context save/restore across `await`, which was unsound under concurrent resolution. Async work belongs in service methods, not in container resolution.
- **No auto-binding**: the `@injectable()` decorator, `bootstrap()`, and `InjectionToken` factories are removed. Every binding is explicit via `bind`/`bindAll`; resolving an unbound token throws `NoBindingFoundError`. `InjectionToken` is a plain typed token (description only).
- **Provider scopes**: bindings accept `scope: "Singleton" | "Transient"` (`Singleton` remains the default). Transient providers construct a new value on every resolution and never cache. Constructor, value, and existing providers are always singletons. Request scope is intentionally not implemented.
- **Lifecycle hooks**: instance, constant value, and dynamic value bindings accept `onActivated(instance, container)` (may return a replacement value) and `onDeactivated(instance, container)`. Deactivation runs for container-owned (singleton-cached) values when their provider is unbound — in creation order on `unbindAll()`, with all bindings staying resolvable until every deactivation handler has run, so deactivating services can still communicate. Transient values are not tracked and never deactivate.
- **Lifecycle-aware unbinding**: `unbind()` accepts a token or a provider and deactivates the token's constructed values before removal. `unbindAll()` deactivates everything it owns.
- **Per-provider instance cache**: singletons are cached per provider rather than per token. Service redirection (`service`) resolutions always delegate to their target token and never own instances — this prevents double deactivation and keeps transient targets transient when resolved through an alias.
- **Introspection**: `container.hasOwn(token)` checks this container only; `container.parent` is public.
- **Named errors**: `NoBindingFoundError` and `CircularDependencyError` are exported from `errors.ts` for `instanceof` checks.

## Known upstream semantics kept as-is

- **Inheritance aliasing**: binding a class provider also registers `useExisting` aliases for its parent classes, so resolving a base class finds bound subclasses.
- `unbindAll()` also removes the container's self-binding (`Container` token).
- `bind()` throws when re-binding a token whose provider already constructed values; `unbind()` first, then bind.
