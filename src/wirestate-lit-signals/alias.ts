import { Signal } from "signal-polyfill";

/**
 * @group Signals
 * @see {@link https://lit.dev/docs/data/signals/}
 */
export {
  signal,
  SignalWatcher,
  computed,
  Signal,
  watch,
  WatchDirective,
  withWatch,
  WatchDirectiveFunction,
} from "@lit-labs/signals";

/**
 * @group Signals
 * @see {@link https://lit.dev/docs/data/signals/}
 */
export type State<T> = Signal.State<T>;

/**
 * @group Signals
 * @see {@link https://lit.dev/docs/data/signals/}
 */
export type Computed<T> = Signal.Computed<T>;
