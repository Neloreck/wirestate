# About Wirestate

Wirestate is a DI-backed architecture layer for TypeScript apps.

Application logic lives in injectable services. React and Lit adapters provide those services to UI trees. Services
communicate through container-local events, commands, and queries.

Reactivity stays outside the core. Use MobX, Preact Signals, or your own reactivity adapter.

## Core Ideas

- `@Injectable` services for state, workflows, and shared application logic.
- Scoped containers for apps, subtrees, tests, tenants, modals, and features.
- Lifecycle hooks for service setup, provider ownership, cleanup, and disposal.
- Container-local events, commands, and queries.
- React and Lit adapters for connecting containers to UI trees.

## Start Here

- [Core](/core/overview) covers framework-agnostic services, containers, lifecycle, messaging, and tests.
- [React](/react/overview) covers React providers, hooks, messaging, and tests.
- [Lit](/lit/overview) covers Lit providers, decorators, controllers, messaging, and tests.
- [React Signals](/react-signals/overview), [React MobX](/react-mobx/overview),
  [Lit Signals](/lit-signals/overview), and [Lit MobX](/lit-mobx/overview) cover framework reactivity packages.
