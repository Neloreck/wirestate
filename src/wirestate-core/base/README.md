# Wirestate DI Base

Generic, wirestate-agnostic dependency injection container. Forked from [needle-di](https://github.com/needle-di/needle-di) (MIT, © Dirk Luijk) at v1.x and maintained independently — upstream merges are not expected.

This layer must stay free of wirestate-specific behavior (lifecycle decorators, events/commands/queries, seeds, provisioning). Wirestate semantics are layered on top through `@wirestate/core` binding helpers.

## Divergences from upstream needle-di

- **Tooling**: tests run on jest (converted from vitest), code follows repository eslint/prettier conventions, imports are extensionless.
- **Wirestate terminology**: bindings are descriptors with `token`/`value`/`factory` fields and exactly three kinds — `Value`, `Instance`, and `Factory` — with `Identifier` tokens, `"Singleton"`/`"Transient"` scopes, and `NoBindingFoundError`. Wirestate-level descriptors pass through to `container.bind` without field mapping.
- **No async resolution**: `getAsync`, `injectAsync`, async factory providers, and `bootstrapAsync` are removed. Resolution is a single synchronous path — this also removes upstream's retry workaround for sync-over-async construction and the injection-context save/restore across `await`, which was unsound under concurrent resolution. Async work belongs in service methods, not in container resolution.
- **No auto-binding, `@Injectable` enforced**: every binding is explicit via `bind`; resolving an unbound token throws `NoBindingFoundError`. The `@Injectable()` marker lives in the base and is enforced at bind time for instance bindings. `InjectionToken` is a plain typed token (description only).
- **Binding scopes**: instance and factory descriptors accept `scope: "Singleton" | "Transient"` (`Singleton` remains the default). Transient bindings construct a new value on every resolution and never cache. Value descriptors are always singletons. Request scope is intentionally not implemented.
- **Lifecycle hooks**: all binding descriptors accept `onActivated(instance, container)` (may return a replacement value) and `onDeactivated(instance, container)`. Deactivation runs for container-owned (singleton-cached) values when their provider is unbound — in creation order on `unbindAll()`, with all bindings staying resolvable until every deactivation handler has run, so deactivating services can still communicate. Transient values are not tracked and never deactivate.
- **Lifecycle-aware unbinding**: `unbind()` accepts a token and deactivates the token's constructed values before removal. `unbindAll()` deactivates everything it owns.
- **No inheritance aliasing and no service redirections**: tokens resolve only what was explicitly bound for them. Aliasing a token is expressed with a factory binding delegating to `container.get`.
- **No `bindAll()` / `createChild()`**: bindings are registered one descriptor at a time via chained `bind()` calls, and child containers are constructed directly with `new Container(parent)`.
- **Token-only unbinding**: `unbind()` takes tokens only — it does not accept binding descriptors.
- **Per-descriptor instance cache**: each token holds exactly one binding descriptor; its singleton value is cached against the descriptor object.
- **Introspection**: `container.hasOwn(token)` checks this container only; `container.parent` is public.
- **Named errors**: `NoBindingFoundError` and `CircularDependencyError` are exported from `errors.ts` for `instanceof` checks.

## Known upstream semantics kept as-is

- `unbindAll()` also removes the container's self-binding (`Container` token).
- `bind()` throws when re-binding a token whose provider already constructed values; `unbind()` first, then bind.
