import { Optional } from "@/wirestate/types/general";

/**
 * Signal identifier. Use symbols for private signals.
 */
export type TSignalType = string | symbol;

/**
 * Signal object.
 */
export interface ISignal<P = unknown, T extends TSignalType = TSignalType, F = unknown> {
  readonly type: T;
  readonly payload?: P;
  readonly from?: F;
}

/**
 * Signal handler signature.
 */
export type TSignalHandler<S extends ISignal = ISignal> = (signal: S) => void;

/**
 * Unsubscribes from signals.
 */
export type TSignalUnsubscribe = () => void;

/**
 * Internal dispatch entry.
 *
 * @internal
 */
export interface ISignalDispatchEntry {
  readonly types: Optional<ReadonlyArray<ISignal["type"]>>;
  readonly handler: TSignalHandler;
}

/**
 * Metadata for OnSignal decorated methods.
 *
 * @internal
 */
export interface ISignalHandlerMetadata {
  readonly methodName: string | symbol;
  readonly types: Optional<ReadonlyArray<TSignalType>>;
}

/**
 * Signal emitter signature.
 */
export type TSignalEmitter<P = unknown, T extends TSignalType = TSignalType, F = unknown> = (
  type: T,
  payload?: P,
  from?: F
) => void;
