/**
 * Signal identifier. Use symbols for private signals.
 */
export type TSignalType = string | symbol;

/**
 * Signal object.
 */
export interface ISignal<P = unknown, T extends TSignalType = TSignalType> {
  readonly type: T;
  readonly payload?: P;
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
  readonly types: ReadonlyArray<ISignal["type"]> | null;
  readonly handler: TSignalHandler;
}

/**
 * Metadata for OnSignal decorated methods.
 *
 * @internal
 */
export interface ISignalHandlerMetadata {
  readonly methodName: string | symbol;
  readonly types: ReadonlyArray<TSignalType> | null;
}

/**
 * Signal emitter signature.
 */
export type TSignalEmitter = (signal: ISignal) => void;
