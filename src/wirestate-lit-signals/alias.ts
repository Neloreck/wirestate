import { Signal } from "signal-polyfill";

export {
  signal,
  svg,
  SignalWatcher,
  computed,
  Computed,
  Signal,
  watch,
  WatchDirective,
  withWatch,
  WatchDirectiveFunction,
} from "@lit-labs/signals";

export type State<T> = Signal.State<T>;
