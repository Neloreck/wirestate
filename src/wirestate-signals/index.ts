/**
 * Framework-agnostic Preact Signals re-exports for Wirestate services.
 *
 * Shared by `@wirestate/react-signals` and `@wirestate/lit-signals` so that signal-based
 * services can be defined once and consumed from either React or Lit applications.
 *
 * @packageDocumentation
 */

/**
 * @group Signals
 * @see {@link https://preactjs.com/guide/v10/signals/}
 */
export {
  Model,
  ModelConstructor,
  ReadonlySignal,
  Signal,
  action,
  batch,
  computed,
  createModel,
  effect,
  signal,
  untracked,
} from "@preact/signals-core";
