/**
 * Preact Signals React reactivity binding (`@preact/signals-react`) for Wirestate React services.
 *
 * Signal state is defined with `@wirestate/signals`.
 * This package wires those signals into React rendering through `@preact/signals-react`.
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
export { type EffectStore } from "@preact/signals-react/runtime";
export { wrapJsx, useSignals, ensureFinalCleanup } from "@preact/signals-react/runtime";
