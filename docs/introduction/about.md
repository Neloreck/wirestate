# About Wirestate

Wirestate is a DI-backed architecture layer for TypeScript apps.

Application logic lives in injectable services. React and Lit adapters provide those services to UI trees. Services
communicate through container-local events, commands, and queries.

Reactivity stays outside the core. Use MobX, Preact Signals, Lit Signals, or other solutions.

## Core Ideas

- `@Injectable` services for state, workflows, and shared application logic.
- Scoped containers for apps, subtrees, tests, tenants, modals, and features.
- Lifecycle hooks for service setup, provider ownership, cleanup, and disposal.
- Container-local events, commands, and queries.
- Seeds for SSR hydration, deterministic tests, and subtree startup data.
- React and Lit adapters for connecting containers to UI trees.

## When It Fits

Use Wirestate when feature logic, state, or workflows should live outside UI components. It fits when you need:

- Services scoped to an app, subtree, modal, tenant, or test.
- Logic that can be tested without rendering UI.
- Clear boundaries between UI components and application services.

## Start Here

- [Core](/core/overview) covers framework-agnostic services, containers, lifecycle, messaging, seeds, and tests.
- [React](/react/overview) covers React providers, hooks, messaging, seeds, and tests.
- [Lit](/lit/overview) covers Lit providers, decorators, controllers, messaging, seeds, and tests.
- [React Signals](/react-signals/overview), [React MobX](/react-mobx/overview), and
  [Lit Signals](/lit-signals/overview) cover framework-specific reactivity packages.
