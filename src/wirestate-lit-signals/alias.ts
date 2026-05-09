import { Signal } from "signal-polyfill";

export {
  signal,
  svg,
  SignalWatcher,
  computed,
  Signal,
  watch,
  WatchDirective,
  withWatch,
  WatchDirectiveFunction,
} from "@lit-labs/signals";

export type State<T> = Signal.State<T>;

export type Computed<T> = Signal.Computed<T>;
