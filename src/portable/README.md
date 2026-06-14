# Portable Bundle Entries [[monorepo](https://github.com/Neloreck/wirestate)] [[docs](https://neloreck.github.io/wirestate/)]

This directory contains build entry points for portable Wirestate bundles. They are not separate published packages.
`pnpm build:ptb` uses them to emit combined ESM bundles under `target/dist/wirestate-portable`.

## Entries

- `wirestate.ts`: core containers, services, lifecycle, events, commands, and queries.
- `wirestate-react-mobx.ts`: core, React bindings, and MobX re-exports.
- `wirestate-react-signals.ts`: core, React bindings, and Preact Signals re-exports.
- `wirestate-lit-signals.ts`: core, Lit bindings, Preact Signals, and Lit signal rendering helpers.
- `wirestate-lit-mobx.ts`: core, Lit bindings, MobX re-exports, and Lit MobX rendering helpers.
