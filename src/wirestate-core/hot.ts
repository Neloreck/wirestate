/**
 * Development-only hot-reload entrypoint for Wirestate: the runtime the `@wirestate/dev`
 * bundler plugin and framework providers use to swap containers in place when service
 * modules are hot-replaced.
 *
 * @remarks
 * Nothing here runs in production builds: the bundler plugin only injects calls during
 * development, and framework integrations gate their registration on `NODE_ENV`. A
 * transformed module opens itself with {@link openHotModule}, lets `@Injectable()` collect
 * its classes while the body evaluates, and closes with {@link closeHotModule}.
 *
 * @packageDocumentation
 */

export { type HotSwapOwner, registerHotSwapOwner } from "./hot/hot-owner";
export { closeHotModule, isHotSwapping, openHotModule, registerHotModule } from "./hot/hot-registry";
export { requestHotSwap } from "./hot/hot-swap";
