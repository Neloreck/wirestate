/**
 * Bundler-agnostic core of the Wirestate development tooling: the source transform
 * that gives `@Injectable()` classes stable hot-reload identities. Bundler adapters
 * such as `@wirestate/dev/vite` build on these primitives.
 *
 * @packageDocumentation
 */

export { createHotFooter, findInjectableClassNames, transformHotModule } from "./transform/hot-transform";
