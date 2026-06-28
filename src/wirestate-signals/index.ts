/**
 * Framework-agnostic Preact Signals re-exports for Wirestate services.
 *
 * Define signal-based service state here once, then render it with `@wirestate/react-signals` (React) or
 * `@wirestate/lit-signals` (Lit).
 *
 * @packageDocumentation
 */

/**
 * @group Signals
 * @see {@link https://preactjs.com/guide/v10/signals/}
 */
export { type Model, type ModelConstructor, type ReadonlySignal } from "@preact/signals-core";

/**
 * @group Signals
 * @see {@link https://preactjs.com/guide/v10/signals/}
 */
export { Signal, action, batch, computed, createModel, effect, signal, untracked } from "@preact/signals-core";
