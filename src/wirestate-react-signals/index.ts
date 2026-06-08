/**
 * Preact Signals React reactivity binding (`@preact/signals-react`) for Wirestate React services.
 *
 * Signal state is defined with `@wirestate/signals`; this package wires those signals into
 * React rendering through `@preact/signals-react`.
 *
 * @packageDocumentation
 */

/**
 * @group Signals React
 * @see {@link https://www.npmjs.com/package/@preact/signals-react}
 */
export { useComputed, useModel, useSignal, useSignalEffect } from "@preact/signals-react";

/**
 * @group Signals React
 * @see {@link https://www.npmjs.com/package/@preact/signals-react}
 */
export { EffectStore, wrapJsx, useSignals, ensureFinalCleanup } from "@preact/signals-react/runtime";
