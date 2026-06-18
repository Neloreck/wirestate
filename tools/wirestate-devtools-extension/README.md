# Wirestate DevTools

Chrome DevTools extension for inspecting Wirestate applications.

The extension adds a **Wirestate** panel to browser DevTools. It connects to the page through
`globalThis.__WIRESTATE_DEVTOOLS_HOOK__` and shows live Wirestate container state:

- container hierarchy,
- bindings and active instances,
- registered plugins,
- event, command, and query activity.

The panel is read-only. It is intended for debugging application structure and message flow, not
for changing runtime state.

## Development

```sh
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

`pnpm build` writes the unpacked Chrome extension to `dist/`.

To run it locally, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and
select `tools/wirestate-devtools-extension/dist`.

Use `pnpm dev` while working on the panel or bridge.
