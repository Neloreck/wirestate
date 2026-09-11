/**
 * Bundler-agnostic core of the Wirestate development tooling: the source transform
 * that wraps modules declaring `@Injectable()` classes in hot-reload markers. No
 * parser is involved: the Wirestate runtime attributes classes to their module while
 * it evaluates. Bundler adapters such as `@wirestate/dev/vite` build on these primitives.
 *
 * @packageDocumentation
 */

export { createHotFooter, createHotHeader, transformHotModule } from "./transform/hot-transform";
