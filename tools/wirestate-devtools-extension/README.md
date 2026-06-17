# Wirestate DevTools — extension prototype

A **prototype** Chrome DevTools extension that inspects any Wirestate page through the v1
devtools hook (`globalThis.__WIRESTATE_DEVTOOLS_HOOK__`). It is **unpublished and intentionally
unfrozen**: its job is to exercise the release-candidate protocol **cross-process** and feed
friction back before the protocol locks. See [ADR 0011](../../adr/0011-devtools-plugin-and-bridge.md)
("Phase C" / the lock gate) and [CONTEXT.md](../../CONTEXT.md) (_Inspector backend_, _Bridge_,
_Panel_).

This is a standalone project — **not** part of the pnpm workspace and **not** a published
`@wirestate/*` package. It has its own toolchain (vite + `@crxjs/vite-plugin`), like the apps
under `examples/`.

## Architecture

Four execution contexts (declared in [`manifest.config.ts`](manifest.config.ts)):

```
PAGE (MAIN world)              ISOLATED world        extension processes
┌────────────────────────┐    ┌──────────────┐    ┌────────────┐   ┌──────────────┐
│ app + DevToolsHook     │    │ content      │    │ background │   │ DevTools     │
│ + backend (pre-seeds   │◄──►│ script       │◄──►│ worker     │◄─►│ panel (React)│
│   hook, ring buffer,   │win │ (relay)      │port│ (pair by   │port│              │
│   serializes payloads) │msg │              │    │  tab id)   │   │              │
└────────────────────────┘    └──────────────┘    └────────────┘   └──────────────┘
        the BRIDGE ────────────────────────────────────────────────────────►
```

- `src/backend/` — the **inspector backend** (vanilla, MAIN world). `create-hook.ts` pre-seeds the
  hook at `document_start` so the app's plugin reuses it (first-writer-wins); `backend.ts` keeps a
  bounded ring buffer for late-attach replay and posts deltas; `dehydrate.ts` turns raw message
  payloads into a lossy bounded preview before they cross the bridge.
- `src/bridge/` — the **bridge**: `messages.ts` (shared types/constants), `content-script.ts` (the
  ISOLATED relay), `background.ts` (the worker that pairs a page with its panel by tab id). Both
  ends reconnect after the worker sleeps.
- `src/panel/` — the **panel** (React, **Tailwind**): a **master–detail** UI over a docked
  Timeline. `panel.html` + `main.tsx` boot it; `Panel.tsx` composes `StatusBar`, `Navigator` (the
  container-hierarchy tree), `detail/` (per-entity Detail views — container/instance/binding/plugin,
  with breadcrumb + dead-entity tombstone), and `timeline/` (filterable, cross-linked deltas with
  inline payload expansion). `use-bridge.ts` owns the connection; `use-panel-state.ts` holds
  selection + filter + view prefs; `selectors.ts` derives the tree/history/filtered views;
  `format.ts` renders deltas. Read-only (no state restoration / time-travel). See
  [plan.md](plan.md) for the full UI design + the protocol-gap findings ledger.
- `src/devtools/` — `devtools.html` + `devtools.ts`, the DevTools page that registers the panel.
- `src/types/general.ts` — `Optional` / `Nullable` / `Maybe`, mirroring core's vocabulary (ADR 0009).
- Pure logic (`selectors.ts`, `dehydrate.ts`, …) has Vitest coverage: `pnpm test`.

Conventions: imports use the **`@/` alias** for `src` (e.g. `@/bridge/messages`); HTML entries live
**inside `src/`** next to their context (not the root, and not `public/` — which is copied verbatim
and wouldn't bundle the module scripts). The DevTools tab glyph is an emoji in the panel _title_
(Chrome ignores `panels.create`'s `iconPath` in the tab; the PNGs power `manifest.icons`).

The protocol _types_ resolve to `../../src/wirestate-core/plugin/devtools/devtools-hook.ts` via a
dev-time alias (tsconfig `paths` + vite alias), so a change to the RC protocol shows up here
immediately. The published-barrel compile is covered by `examples/wirestate-react-devtools`.

## Run

```sh
pnpm install
pnpm build          # emits dist/ (the unpacked extension)
# or: pnpm dev       # vite + crx HMR
pnpm test           # vitest — pure-logic unit tests
pnpm typecheck      # tsc --noEmit
```

Then in Chrome: `chrome://extensions` → enable Developer mode → **Load unpacked** → pick `dist/`
(or the `dev` server's output). Open the example app
(`examples/wirestate-react-devtools`, `pnpm dev`) in a tab, open DevTools, pick the **Wirestate**
panel.

### Icons

The committed `icons/icon-{16,32,48,128}.png` are rasterized from `icons/icon.svg` (the brand cog,
mirrored from `docs/public/logo.svg`) — Chrome rejects SVG for manifest/panel icons. Regenerate
after editing the SVG with `pnpm icons` (WASM rasterizer, no native build). `manifest.icons` uses
them for the `chrome://extensions` listing and toolbar.

The **DevTools tab glyph**, though, comes from the emoji prefixed to the panel _title_
(`⚙️ Wirestate`), **not** from an icon file: Chrome does not render `panels.create`'s `iconPath` in
the tab label. This is the same trick React DevTools uses to title its panels "⚛️ Components" /
"⚛️ Profiler".

## Phase-C acceptance (flips the protocol lock)

- [ ] Pre-seed handshake: backend seeds the hook, the app's plugin reuses it.
- [ ] Tree parity with the in-app `DevToolsPanel` (side-by-side).
- [ ] Event / command / query each surface in the timeline across the bridge.
- [ ] Register / unregister deltas surface.
- [ ] A non-clonable payload (function / class instance / cyclic) crosses the bridge and renders a preview.
- [ ] Late-attach: open DevTools after activity → buffer replays, `getRoots()` shows current structure.
- [ ] Port drop / worker sleep → panel re-syncs.
- [ ] Two providers → two roots.
- [ ] Route/mount churn keeps the tree at the live provisioned set, no ghosts.

## Known risks to validate in the browser

- **MAIN-world content script timing.** `@crxjs` may wrap the backend as an async module, so the
  `document_start` pre-seed could occasionally lose the race to a very early plugin install. The
  dual handshake (pre-seed **or** reuse) and `getRoots()` recovery make this degrade gracefully,
  but confirm the pre-seed path actually wins against the example app. If not, switch the backend
  to script-tag injection via a `web_accessible_resource`.
- **Version pins.** `vite` / `@crxjs/vite-plugin` (beta) / `@vitejs/plugin-react` are a moving
  target; adjust if install/build complains.
