import { Signal } from "signal-polyfill";

/**
 * @group signals
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
 * @group signals
 * @see {@link https://lit.dev/docs/data/signals/}
 */
export type State<T> = Signal.State<T>;

/**
 * @group signals
 * @see {@link https://lit.dev/docs/data/signals/}
 */
export type Computed<T> = Signal.Computed<T>;
