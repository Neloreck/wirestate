/**
 * Side-effect module that installs the `Symbol.metadata` polyfill required by
 * TC39 standard decorators.
 *
 * This module is imported for its side effect by the core registry, so any
 * decorator import evaluates it before consumer classes are defined.
 *
 * @packageDocumentation
 */

/**
 * `Symbol` constructor shape exposing the optional `metadata` well-known symbol.
 *
 * @group Metadata
 * @internal
 */
interface SymbolConstructorWithMetadata {
  metadata?: symbol;
}

const symbolWithMetadata: SymbolConstructorWithMetadata = Symbol as SymbolConstructorWithMetadata;

if (symbolWithMetadata.metadata === undefined) {
  symbolWithMetadata.metadata = Symbol.for("Symbol.metadata");
}

/**
 * Resolved well-known symbol that keys standard decorator metadata objects on classes.
 *
 * @remarks
 * Matches `Symbol.metadata` when the runtime (or the polyfill above) defines
 * it, falling back to the shared `Symbol.for("Symbol.metadata")` registry
 * symbol used by Babel's standard-decorator helpers.
 *
 * @group Metadata
 * @internal
 */
export const METADATA_SYMBOL: symbol = symbolWithMetadata.metadata ?? Symbol.for("Symbol.metadata");
