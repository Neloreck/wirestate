/**
 * MobX React reactivity binding (`mobx-react-lite`) for Wirestate React services.
 *
 * Observable service state is authored with `@wirestate/mobx`; this package wires those
 * observables into React rendering through `mobx-react-lite`.
 *
 * @packageDocumentation
 */

/**
 * @group MobX React
 * @see {@link https://mobx.js.org/react-integration.html}
 */
export {
  Observer,
  clearTimers,
  enableStaticRendering,
  isObserverBatched,
  isUsingStaticRendering,
  observer,
  observerBatching,
  useAsObservableSource,
  useLocalObservable,
  useLocalStore,
  useObserver,
} from "mobx-react-lite";
